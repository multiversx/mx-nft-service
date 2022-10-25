import { Inject, Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import BigNumber from 'bignumber.js';
import {
  Address,
  BigUIntValue,
  BytesValue,
  ContractFunction,
  Interaction,
  ResultsParser,
  TokenPayment,
  U32Value,
  U64Value,
} from '@elrondnetwork/erdjs';
import { cacheConfig, elrondConfig, gas } from '../../config';
import { TransactionNode } from '../common/transaction';
import { ContractLoader } from '@elrondnetwork/erdnest/lib/src/sc.interactions/contract.loader';
import { BuyTicketsArgs, ClaimTicketsArgs } from './models';
import { ConfigureCollectionArgs } from './models/ConfigureCollectionForSaleArgs';
import { SetSaleClaimPeriodArgs } from './models/SetSaleAndClaimTimePeriodArgs';
import { ElrondProxyService, RedisCacheService } from 'src/common';
import { PrimarySaleTimeAbi } from './models/PrimarySaleTimestamp.abi';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { PrimarySale } from './models/PrimarySale.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrimarySaleTime } from './models/PrimarySaleTime';

@Injectable()
export class PrimarySaleService {
  private redisClient: Redis.Redis;
  private contract = new ContractLoader(
    './src/abis/primary-sales-sc.abi.json',
    'Sales',
  );
  private readonly parser: ResultsParser;

  constructor(
    private elrondProxyService: ElrondProxyService,
    private redisCacheService: RedisCacheService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
    this.parser = new ResultsParser();
  }

  async getStatus(collectionIdentifier: string): Promise<PrimarySale> {
    try {
      const cacheKey = generateCacheKeyFromParams(
        'primarySaleCollectionStatus',
        collectionIdentifier,
      );
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getStatusMap(collectionIdentifier),
        TimeConstants.oneHour,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting the status.', {
        path: this.getStatus.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getStatusMap(collectionIdentifier: string): Promise<PrimarySale> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let price = <Interaction>(
      contract.methodsExplicit.status([
        BytesValue.fromUTF8(collectionIdentifier),
      ])
    );

    const response = await this.getFirstQueryResult(price);
    const status = response.firstValue.valueOf().name;
    return new PrimarySale({
      status: status,
      collectionIdentifier: collectionIdentifier,
    });
  }

  async getPricePerTicket(collectionIdentifier: string): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams(
        'primarySaleCollectionPrice',
        collectionIdentifier,
      );
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getPricePerTicketMap(collectionIdentifier),
        TimeConstants.oneHour,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting price per ticket.', {
        path: this.getPricePerTicket.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getPricePerTicketMap(
    collectionIdentifier: string,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let price = <Interaction>(
      contract.methodsExplicit.price([
        BytesValue.fromUTF8(collectionIdentifier),
      ])
    );

    const response = await this.getFirstQueryResult(price);
    return response.firstValue.valueOf();
  }

  async getMaxNftPerWallet(collectionIdentifier: string): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams(
        'primarySaleMaxNftWallet',
        collectionIdentifier,
      );
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getMaxNftPerWalletMap(collectionIdentifier),
        TimeConstants.oneHour,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting the max nfts per wallet.',
        {
          path: this.getMaxNftPerWallet.name,
          collectionIdentifier,
          exception: err,
        },
      );
    }
  }

  async getMaxNftPerWalletMap(
    collectionIdentifier: string,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let price = <Interaction>(
      contract.methodsExplicit.max_units_per_wallet([
        BytesValue.fromUTF8(collectionIdentifier),
      ])
    );

    const response = await this.getFirstQueryResult(price);
    return response.firstValue.valueOf().toFixed();
  }

  async getTimestamps(collectionIdentifier: string): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams(
        'primarySaleTimestamp',
        collectionIdentifier,
      );
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getTimestampsMap(collectionIdentifier),
        TimeConstants.oneHour,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting timestamp.', {
        path: this.getTimestampsMap.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getTimestampsMap(
    collectionIdentifier: string,
  ): Promise<PrimarySaleTime> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let price = <Interaction>(
      contract.methodsExplicit.timestamps([
        BytesValue.fromUTF8(collectionIdentifier),
      ])
    );

    const response = await this.getFirstQueryResult(price);
    const saleTime: PrimarySaleTimeAbi = response?.firstValue?.valueOf();
    return PrimarySaleTime.fromAbi(saleTime);
  }

  async buyTicket(
    ownerAddress: string,
    request: BuyTicketsArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let bid = contract.call({
      func: new ContractFunction('buy_tickets'),
      value: TokenPayment.egldFromBigInteger(request.price),
      args: [
        BytesValue.fromUTF8(request.collectionIdentifier),
        new U32Value(new BigNumber(request.ticketsNumber)),
      ],
      gasLimit: gas.bid,
      chainID: elrondConfig.chainID,
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }

  async claim(
    ownerAddress: string,
    request: ClaimTicketsArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );

    let withdraw = contract.call({
      func: new ContractFunction('claim'),
      value: TokenPayment.egldFromAmount(0),
      args: [BytesValue.fromUTF8(request.collectionIdentifier)],
      gasLimit: gas.withdraw,
      chainID: elrondConfig.chainID,
    });
    return withdraw.toPlainObject(new Address(ownerAddress));
  }

  async configureCollection(
    ownerAddress: string,
    request: ConfigureCollectionArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let bid = contract.call({
      func: new ContractFunction('configure_collection_for_sale'),
      value: TokenPayment.egldFromBigInteger(0),
      args: [
        BytesValue.fromUTF8(request.collectionIdentifier),
        new BigUIntValue(new BigNumber(request.price)),
        new U32Value(new BigNumber(request.maxNftsPerWallet)),
      ],
      gasLimit: gas.bid,
      chainID: elrondConfig.chainID,
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }

  async setSaleTime(
    ownerAddress: string,
    request: SetSaleClaimPeriodArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let bid = contract.call({
      func: new ContractFunction('set_sale_timestamps'),
      value: TokenPayment.egldFromBigInteger(0),
      args: [
        BytesValue.fromUTF8(request.collectionIdentifier),
        new U64Value(new BigNumber(request.startSale)),
        new U64Value(new BigNumber(request.endSale)),
        new U64Value(new BigNumber(request.startClaim)),
        new U64Value(new BigNumber(request.endClaim)),
      ],
      gasLimit: gas.bid,
      chainID: elrondConfig.chainID,
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }

  private async getFirstQueryResult(interaction: Interaction) {
    let queryResponse = await this.elrondProxyService
      .getService()
      .queryContract(interaction.buildQuery());
    let result = this.parser.parseQueryResponse(
      queryResponse,
      interaction.getEndpoint(),
    );
    return result;
  }
}
