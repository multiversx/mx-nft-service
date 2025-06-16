import {
  Address,
  BytesValue,
  SmartContractTransactionsFactory,
  Token,
  TokenManagementTransactionsFactory,
  TokenTransfer,
  TransactionsFactoryConfig,
  TransferTransactionsFactory,
  U64Value,
} from '@multiversx/sdk-core';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { FileUpload } from 'graphql-upload-ts';
import { MxApiService } from 'src/common';
import { MxStats } from 'src/common/services/mx-communication/models/mx-stats.model';
import { gas, mxConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getCollectionAndNonceFromIdentifier, timestampToEpochAndRound } from 'src/utils/helpers';
import '../../utils/extensions';
import { TransactionNode } from '../common/transaction';
import { FileContent } from '../ipfs/file.content';
import { UploadToIpfsResult } from '../ipfs/ipfs.model';
import { PinataService } from '../ipfs/pinata.service';
import { S3Service } from '../s3/s3.service';
import { CreateNftRequest, CreateNftWithMultipleFilesRequest, TransferNftRequest, UpdateQuantityRequest } from './models/requests';

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
    const factory = new SmartContractTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: mxConfig.chainID }) });
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      function: request.functionName,
      arguments: [BytesValue.fromUTF8(collection), BytesValue.fromHex(nonce), new U64Value(new BigNumber(request.quantity))],
      gasLimit: gas.addBurnQuantity,
      contract: Address.newFromBech32(request.updateQuantityRoleAddress),
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

    const nonceDecimal = BigInt(parseInt(nonce, 16));
    const nft = new Token({ identifier: collection, nonce: nonceDecimal });
    const transfer = new TokenTransfer({ token: nft, amount: BigInt(transferRequest.quantity) });
    const factory = new TransferTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: mxConfig.chainID }) });
    const transaction = factory.createTransactionForTransfer(Address.newFromBech32(ownerAddress), {
      receiver: Address.newFromBech32(transferRequest.destinationAddress),
      tokenTransfers: [transfer],
    });
    return transaction.toPlainObject();
  }

  private async getCreateNftTransaction(
    ownerAddress: string,
    request: CreateNftRequest | CreateNftWithMultipleFilesRequest,
    filesData: UploadToIpfsResult[],
  ) {
    const assetMetadata = await this.uploadFileMetadata(request.attributes.description);
    const attributes = `tags:${request.attributes.tags};metadata:${assetMetadata.hash}`;
    const factory = new TokenManagementTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: mxConfig.chainID }) });
    const uris = [];
    for (const file of filesData) {
      uris.push(file.url);
    }
    const transaction = factory.createTransactionForCreatingNFT(Address.newFromBech32(ownerAddress), {
      tokenIdentifier: request.collection,
      initialQuantity: BigInt(request.quantity),
      name: request.name,
      royalties: parseInt(request.royalties),
      hash: filesData[0].hash,
      attributes: Buffer.from(attributes),
      uris: uris,
    });

    return transaction.toPlainObject();
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
    const fileData = await this.pinataService.uploadFile(fileUpload);
    await this.s3Service.upload(fileUpload, fileData.hash);
    return fileData;
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
