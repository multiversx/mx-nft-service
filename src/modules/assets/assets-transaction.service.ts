import { Address, AddressValue, BytesValue, ContractFunction, U64Value } from '@multiversx/sdk-core';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MxApiService, getSmartContract } from 'src/common';
import { mxConfig, gas } from 'src/config';
import { getCollectionAndNonceFromIdentifier, timestampToEpochAndRound } from 'src/utils/helpers';
import '../../utils/extensions';
import { nominateVal } from '../../utils/formatters';
import { FileContent } from '../ipfs/file.content';
import { PinataService } from '../ipfs/pinata.service';
import { S3Service } from '../s3/s3.service';
import BigNumber from 'bignumber.js';
import { TransactionNode } from '../common/transaction';
import { UpdateQuantityRequest, CreateNftRequest, TransferNftRequest, CreateNftWithMultipleFilesRequest } from './models/requests';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { FileUpload } from 'graphql-upload';
import { MxStats } from 'src/common/services/mx-communication/models/mx-stats.model';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { UploadToIpfsResult } from '../ipfs/ipfs.model';

@Injectable()
export class AssetsTransactionService {
  constructor(
    private pinataService: PinataService,
    private s3Service: S3Service,
    private mxApiService: MxApiService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {}

  async updateQuantity(ownerAddress: string, request: UpdateQuantityRequest): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);
    const contract = getSmartContract(request.updateQuantityRoleAddress);
    const transaction = contract.call({
      func: new ContractFunction(request.functionName),
      args: [BytesValue.fromUTF8(collection), BytesValue.fromHex(nonce), new U64Value(new BigNumber(request.quantity))],
      gasLimit: gas.addBurnQuantity,
      chainID: mxConfig.chainID,
      caller: Address.fromString(ownerAddress),
    });
    return transaction.toPlainObject();
  }

  async burnQuantity(ownerAddress: string, request: UpdateQuantityRequest): Promise<TransactionNode> {
    const [nft, mxStats] = await Promise.all([this.mxApiService.getNftByIdentifier(request.identifier), this.getOrSetAproximateMxStats()]);

    if (!nft) {
      throw new NotFoundException('NFT not found');
    }

    const [epoch] = timestampToEpochAndRound(
      nft.timestamp,
      mxStats.epoch,
      mxStats.roundsPassed,
      mxStats.roundsPerEpoch,
      mxStats.refreshRate,
    );

    if (epoch > mxConfig.burnNftActivationEpoch) {
      return await this.updateQuantity(ownerAddress, request);
    }

    return await this.transferNft(
      ownerAddress,
      new TransferNftRequest({
        identifier: request.identifier,
        quantity: request.quantity,
        destinationAddress: mxConfig.burnAddress,
      }),
    );
  }

  async createNftWithMultipleFiles(ownerAddress: string, request: CreateNftWithMultipleFilesRequest): Promise<TransactionNode> {
    let uploadFilePromises = [];
    for (const file of request.files) {
      uploadFilePromises.push(this.uploadFileToPinata(file));
    }
    const filesToIpfs = await Promise.all(uploadFilePromises);

    return this.getCreateNftTransaction(ownerAddress, request, filesToIpfs);
  }

  async createNft(ownerAddress: string, request: CreateNftRequest): Promise<TransactionNode> {
    const fileData = await this.uploadFileToPinata(request.file);

    return this.getCreateNftTransaction(ownerAddress, request, [fileData]);
  }

  async transferNft(ownerAddress: string, transferRequest: TransferNftRequest): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(transferRequest.identifier);
    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(transferRequest.quantity)),
        new AddressValue(new Address(transferRequest.destinationAddress)),
      ],
      gasLimit: gas.nftTransfer,
      chainID: mxConfig.chainID,
      caller: Address.fromString(ownerAddress),
    });
    let response = transaction.toPlainObject();
    response.gasLimit = Math.max(mxConfig.transferMinCost + response.data.length * mxConfig.pricePerByte, gas.nftTransfer);
    return {
      ...response,
      chainID: mxConfig.chainID,
    };
  }

  private async getCreateNftTransaction(
    ownerAddress: string,
    request: CreateNftRequest | CreateNftWithMultipleFilesRequest,
    filesData: UploadToIpfsResult[],
  ) {
    const assetMetadata = await this.uploadFileMetadata(request.attributes.description);
    const attributes = `tags:${request.attributes.tags};metadata:${assetMetadata.hash}`;
    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTCreate'),
      args: this.getCreateNftsArgs(request, filesData, attributes),
      gasLimit: gas.nftCreate,
      chainID: mxConfig.chainID,
      caller: Address.fromString(ownerAddress),
    });
    let response = transaction.toPlainObject();

    return {
      ...response,
      gasLimit: gas.nftCreate + response.data.length * mxConfig.pricePerByte,
      chainID: mxConfig.chainID,
    };
  }

  private async uploadFileMetadata(description: string): Promise<any> {
    const fileMetadata = new FileContent({
      description: description,
    });
    const assetMetadata = await this.pinataService.uploadText(fileMetadata);

    await this.s3Service.uploadText(fileMetadata, assetMetadata.hash);
    return assetMetadata;
  }

  private async uploadFileToPinata(fileUpload: FileUpload) {
    const file = await fileUpload;
    const fileData = await this.pinataService.uploadFile(file);
    await this.s3Service.upload(file, fileData.hash);
    return fileData;
  }

  private getCreateNftsArgs(request: CreateNftWithMultipleFilesRequest | CreateNftRequest, filesToIpfs: any[], attributes: string) {
    const args = [
      BytesValue.fromUTF8(request.collection),
      new U64Value(new BigNumber(request.quantity)),
      BytesValue.fromUTF8(request.name),
      BytesValue.fromHex(nominateVal(parseFloat(request.royalties))),
      BytesValue.fromUTF8(filesToIpfs[0].hash),
      BytesValue.fromUTF8(attributes),
    ];
    for (const file of filesToIpfs) {
      args.push(BytesValue.fromUTF8(file.url));
    }
    return args;
  }

  private async getOrSetAproximateMxStats(): Promise<MxStats> {
    try {
      const cacheKey = this.getApproximateMxStatsCacheKey();
      const getMxStats = () => this.mxApiService.getMxStats();
      return this.redisCacheService.getOrSet(cacheKey, getMxStats, Constants.oneDay());
    } catch (error) {
      this.logger.error('An error occurred while getting mx stats', {
        path: `${AssetsTransactionService.name}.${this.getOrSetAproximateMxStats.name}`,
        exception: error,
      });
    }
  }

  private getApproximateMxStatsCacheKey() {
    return generateCacheKeyFromParams('assets', 'approximateMxStats');
  }
}
