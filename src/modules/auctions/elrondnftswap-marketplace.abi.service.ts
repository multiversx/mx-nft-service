import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extentions';
import {
  AuctionAbi,
  BuySftActionArgs,
  ExternalAuctionAbi,
  OfferAbi,
  SwapAbi,
} from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
  AddressValue,
  BigUIntValue,
  BooleanType,
  BooleanValue,
  BytesValue,
  Interaction,
  OptionalValue,
  TokenIdentifierValue,
  TypedValue,
  U64Type,
  U64Value,
  BigUIntType,
  ResultsParser,
  SmartContract,
} from '@elrondnetwork/erdjs';
import { cacheConfig, elrondConfig } from '../../config';
import { ElrondProxyService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { CreateAuctionRequest } from './models/requests';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { AuctionsGetterService } from './auctions-getter.service';
import { ContractLoader } from '@elrondnetwork/erdnest/lib/src/sc.interactions/contract.loader';
import { MarketplaceUtils } from './marketplaceUtils';
import { Marketplace } from '../marketplaces/models';

@Injectable()
export class ElrondNftSwapMarketplaceAbiService {
  private redisClient: Redis.Redis;
  private readonly parser: ResultsParser;

  private contract = new ContractLoader(
    MarketplaceUtils.elrondNftSwapMarketplaceAbiPath,
    MarketplaceUtils.elrondNftSwapMarketplaceAbiPath,
  );

  constructor(
    private elrondProxyService: ElrondProxyService,
    private auctionsService: AuctionsGetterService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
    private marketplaceService: MarketplacesService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );

    this.parser = new ResultsParser();
  }

  async getAuctionQuery(auctionId: number): Promise<SwapAbi> {
    let scContract: SmartContract;

    scContract = await this.contract.getContract(
      'erd1qqqqqqqqqqqqqpgq8xwzu82v8ex3h4ayl5lsvxqxnhecpwyvwe0sf2qj4e',
    );

    let getDataQuery = <Interaction>(
      scContract.methodsExplicit.getSwapById([
        new U64Value(new BigNumber(auctionId)),
      ])
    );

    const response = await this.getFirstQueryResult(getDataQuery);

    const auction: SwapAbi = response?.firstValue?.valueOf();
    return auction;
  }

  async getOfferAddressesById(auctionId: number): Promise<[Address]> {
    let scContract: SmartContract;

    scContract = await this.contract.getContract(
      'erd1qqqqqqqqqqqqqpgq8xwzu82v8ex3h4ayl5lsvxqxnhecpwyvwe0sf2qj4e',
    );

    let getDataQuery = <Interaction>(
      scContract.methodsExplicit.getOfferAddressesById([
        new U64Value(new BigNumber(auctionId)),
      ])
    );

    const response = await this.getFirstQueryResult(getDataQuery);

    const res = response?.firstValue?.valueOf();
    return res;
  }

  async getOffersAddress(address, auctionId: number): Promise<OfferAbi[]> {
    let scContract: SmartContract;

    scContract = await this.contract.getContract(
      'erd1qqqqqqqqqqqqqpgq8xwzu82v8ex3h4ayl5lsvxqxnhecpwyvwe0sf2qj4e',
    );

    let getDataQuery = <Interaction>(
      scContract.methodsExplicit.getOffersByAddress([
        new U64Value(new BigNumber(auctionId)),
        new AddressValue(new Address(address)),
      ])
    );

    const response = await this.getFirstQueryResult(getDataQuery);

    const offer: OfferAbi[] = response?.firstValue?.valueOf();
    console.log(offer);
    return offer;
  }

  async getCutPercentage(contractAddress: string): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams(
        'marketplaceCutPercentage',
        contractAddress,
      );
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getCutPercentageMap(contractAddress),
        TimeConstants.oneWeek,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting the marketplace cut percentage.',
        {
          path: 'NftMarketplaceAbiService.getCutPercentage',
          exception: err,
        },
      );
    }
  }

  async getIsPaused(contractAddress: string): Promise<boolean> {
    try {
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        generateCacheKeyFromParams('isPaused', contractAddress),
        () => this.getIsPausedAbi(contractAddress),
        TimeConstants.oneWeek,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting the is Paused value.',
        {
          path: 'NftMarketplaceAbiService.getIsPaused',
          exception: err,
        },
      );
    }
  }

  private async getCutPercentageMap(contractAddress: string): Promise<string> {
    const contract = await this.contract.getContract(contractAddress);
    let getDataQuery = <Interaction>(
      contract.methodsExplicit.getMarketplaceCutPercentage()
    );
    const response = await this.getFirstQueryResult(getDataQuery);
    return response.firstValue.valueOf().toFixed();
  }

  private async getIsPausedAbi(contractAddress: string): Promise<boolean> {
    const contract = await this.contract.getContract(contractAddress);
    let getDataQuery = <Interaction>contract.methodsExplicit.isPaused();
    const response = await this.getFirstQueryResult(getDataQuery);
    return response.firstValue.valueOf();
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
