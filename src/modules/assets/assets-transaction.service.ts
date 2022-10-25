import {
  Address,
  AddressValue,
  BytesValue,
  ContractFunction,
  TokenPayment,
  U64Value,
} from '@elrondnetwork/erdjs';
import { Injectable, Logger } from '@nestjs/common';
import {
  ElrondApiService,
  getSmartContract,
  RedisCacheService,
} from 'src/common';
import { cacheConfig, elrondConfig, gas } from 'src/config';
import {
  getCollectionAndNonceFromIdentifier,
  timestampToEpochAndRound,
} from 'src/utils/helpers';
import '../../utils/extensions';
import { nominateVal } from '../../utils/formatters';
import { FileContent } from '../ipfs/file.content';
import { PinataService } from '../ipfs/pinata.service';
import { S3Service } from '../s3/s3.service';
import BigNumber from 'bignumber.js';
import { TransactionNode } from '../common/transaction';
import {
  UpdateQuantityRequest,
  CreateNftRequest,
  TransferNftRequest,
} from './models/requests';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import * as Redis from 'ioredis';
import { TimeConstants } from 'src/utils/time-utils';
import { Stats } from 'src/common/services/elrond-communication/models/stats.model';

@Injectable()
export class AssetsTransactionService {
  private redisClient: Redis.Redis;

  constructor(
    private pinataService: PinataService,
    private s3Service: S3Service,
    private elrondApiService: ElrondApiService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async updateQuantity(
    ownerAddress: string,
    request: UpdateQuantityRequest,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      request.identifier,
    );
    const contract = getSmartContract(request.updateQuantityRoleAddress);
    const transaction = contract.call({
      func: new ContractFunction(request.functionName),
      value: TokenPayment.egldFromAmount(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(request.quantity)),
      ],
      gasLimit: gas.addBurnQuantity,
      chainID: elrondConfig.chainID,
    });
    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async burnQuantity(
    ownerAddress: string,
    request: UpdateQuantityRequest,
  ): Promise<TransactionNode> {
    const [nft, networkStats] = await Promise.all([
      this.elrondApiService.getNftByIdentifier(request.identifier),
      this.getOrSetAproximateNetworkStats(),
    ]);

    if (!nft) {
      throw new Error('NFT not found');
    }

    const [epoch] = timestampToEpochAndRound(
      nft.timestamp,
      networkStats.epoch,
      networkStats.roundsPassed,
      networkStats.roundsPerEpoch,
      networkStats.refreshRate,
    );

    if (epoch > elrondConfig.burnNftActivationEpoch) {
      return await this.updateQuantity(ownerAddress, request);
    }

    return await this.transferNft(
      ownerAddress,
      new TransferNftRequest({
        identifier: request.identifier,
        quantity: request.quantity,
        destinationAddress: elrondConfig.burnAddress,
      }),
    );
  }

  async createNft(
    ownerAddress: string,
    request: CreateNftRequest,
  ): Promise<TransactionNode> {
    const file = await request.file;
    const fileData = await this.pinataService.uploadFile(file);
    const fileMetadata = new FileContent({
      description: request.attributes.description,
    });
    const assetMetadata = await this.pinataService.uploadText(fileMetadata);

    await this.s3Service.upload(file, fileData.hash);
    await this.s3Service.uploadText(fileMetadata, assetMetadata.hash);

    const attributes = `tags:${request.attributes.tags};metadata:${assetMetadata.hash}`;

    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTCreate'),
      value: TokenPayment.egldFromAmount(0),
      args: [
        BytesValue.fromUTF8(request.collection),
        new U64Value(new BigNumber(request.quantity)),
        BytesValue.fromUTF8(request.name),
        BytesValue.fromHex(nominateVal(parseFloat(request.royalties))),
        BytesValue.fromUTF8(fileData.hash),
        BytesValue.fromUTF8(attributes),
        BytesValue.fromUTF8(fileData.url),
      ],
      gasLimit: gas.nftCreate,
      chainID: elrondConfig.chainID,
    });
    let response = transaction.toPlainObject(new Address(ownerAddress));

    return {
      ...response,
      gasLimit:
        gas.nftCreate + response.data.length * elrondConfig.pricePerByte,
      chainID: elrondConfig.chainID,
    };
  }

  async transferNft(
    ownerAddress: string,
    transferRequest: TransferNftRequest,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      transferRequest.identifier,
    );
    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: TokenPayment.egldFromAmount(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(transferRequest.quantity)),
        new AddressValue(new Address(transferRequest.destinationAddress)),
      ],
      gasLimit: gas.nftTransfer,
      chainID: elrondConfig.chainID,
    });
    let response = transaction.toPlainObject(new Address(ownerAddress));
    response.gasLimit = Math.max(
      elrondConfig.transferMinCost +
        response.data.length * elrondConfig.pricePerByte,
      gas.nftTransfer,
    );
    return {
      ...response,
      chainID: elrondConfig.chainID,
    };
  }

  private async getOrSetAproximateNetworkStats(): Promise<Stats> {
    try {
      const cacheKey = this.getApproximateNetworkStatsCacheKey();
      const getNetworkStats = () => this.elrondApiService.getNetworkStats();
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getNetworkStats,
        TimeConstants.oneDay,
      );
    } catch (error) {
      this.logger.error('An error occurred while getting network stats', {
        path: `${AssetsTransactionService.name}.${this.getOrSetAproximateNetworkStats.name}`,
        exception: error,
      });
    }
  }

  private getApproximateNetworkStatsCacheKey() {
    return generateCacheKeyFromParams('assets', 'approximateNetworkStats');
  }
}
