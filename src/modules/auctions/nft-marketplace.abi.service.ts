import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { AuctionAbi, BuySftActionArgs } from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
  AddressValue,
  BigUIntValue,
  BooleanType,
  BooleanValue,
  BytesValue,
  ContractFunction,
  Interaction,
  OptionalValue,
  SmartContract,
  TokenIdentifierValue,
  TypedValue,
  U64Type,
  U64Value,
  BigUIntType,
  TokenPayment,
  ResultsParser,
} from '@elrondnetwork/erdjs';
import { cacheConfig, elrondConfig, gas } from '../../config';
import {
  ElrondProxyService,
  getSmartContract,
  RedisCacheService,
} from 'src/common';
import * as Redis from 'ioredis';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TransactionNode } from '../common/transaction';
import { TimeConstants } from 'src/utils/time-utils';
import {
  BidRequest,
  BuySftRequest,
  CreateAuctionRequest,
} from './models/requests';

@Injectable()
export class NftMarketplaceAbiService {
  private redisClient: Redis.Redis;
  private readonly parser: ResultsParser;
  constructor(
    private elrondProxyService: ElrondProxyService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );

    this.parser = new ResultsParser();
  }

  async createAuction(
    ownerAddress: string,
    args: CreateAuctionRequest,
  ): Promise<TransactionNode> {
    const contract = getSmartContract(ownerAddress);

    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: TokenPayment.egldFromAmount(0),
      args: this.getCreateAuctionArgs(args),
      gasLimit: gas.startAuction,
      chainID: elrondConfig.chainID,
    });
    return createAuctionTx.toPlainObject(new Address(ownerAddress));
  }

  async bid(
    ownerAddress: string,
    request: BidRequest,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      request.identifier,
    );
    const contract =
      await this.elrondProxyService.getMarketplaceAbiSmartContract();
    let bid = contract.call({
      func: new ContractFunction('bid'),
      value: TokenPayment.egldFromBigInteger(request.price),
      args: [
        new U64Value(new BigNumber(request.auctionId)),
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
      ],
      gasLimit: gas.bid,
      chainID: elrondConfig.chainID,
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }

  async withdraw(
    ownerAddress: string,
    auctionId: number,
  ): Promise<TransactionNode> {
    const contract =
      await this.elrondProxyService.getMarketplaceAbiSmartContract();

    let withdraw = contract.call({
      func: new ContractFunction('withdraw'),
      value: TokenPayment.egldFromAmount(0),
      args: [new U64Value(new BigNumber(auctionId))],
      gasLimit: gas.withdraw,
      chainID: elrondConfig.chainID,
    });
    return withdraw.toPlainObject(new Address(ownerAddress));
  }

  async endAuction(
    ownerAddress: string,
    auctionId: number,
  ): Promise<TransactionNode> {
    const contract =
      await this.elrondProxyService.getMarketplaceAbiSmartContract();
    let endAuction = contract.call({
      func: new ContractFunction('endAuction'),
      value: TokenPayment.egldFromAmount(0),
      args: [new U64Value(new BigNumber(auctionId))],
      gasLimit: gas.endAuction,
      chainID: elrondConfig.chainID,
    });

    return endAuction.toPlainObject(new Address(ownerAddress));
  }

  async buySft(
    ownerAddress: string,
    request: BuySftRequest,
  ): Promise<TransactionNode> {
    const contract =
      await this.elrondProxyService.getMarketplaceAbiSmartContract();

    let buySftAfterEndAuction = contract.call({
      func: new ContractFunction('buySft'),
      value: TokenPayment.egldFromBigInteger(request.price),
      args: this.getBuySftArguments(request),
      gasLimit: gas.buySft,
      chainID: elrondConfig.chainID,
    });
    return buySftAfterEndAuction.toPlainObject(new Address(ownerAddress));
  }

  async getAuctionQuery(auctionId: number): Promise<AuctionAbi> {
    const contract =
      await this.elrondProxyService.getMarketplaceAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methodsExplicit.getFullAuctionData([
        new U64Value(new BigNumber(auctionId)),
      ])
    );

    const response = await this.getFirstQueryResult(getDataQuery);

    const auction: AuctionAbi = response?.firstValue?.valueOf();
    return auction;
  }

  async getCutPercentage(): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams('marketplaceCutPercentage');
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getCutPercentageMap(),
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

  async getIsPaused(): Promise<boolean> {
    try {
      return await this.redisCacheService.getOrSet(
        this.redisClient,
        generateCacheKeyFromParams('isPaused'),
        () => this.getIsPausedAbi(),
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

  private async getCutPercentageMap(): Promise<string> {
    const contract =
      await this.elrondProxyService.getMarketplaceAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methodsExplicit.getMarketplaceCutPercentage()
    );
    const response = await this.getFirstQueryResult(getDataQuery);
    console.log(response);
    return response.firstValue.valueOf().toFixed();
  }

  private async getIsPausedAbi(): Promise<boolean> {
    const contract =
      await this.elrondProxyService.getMarketplaceAbiSmartContract();
    let getDataQuery = <Interaction>contract.methodsExplicit.isPaused();
    const response = await this.getFirstQueryResult(getDataQuery);
    return response.firstValue.valueOf();
  }

  private getBuySftArguments(args: BuySftActionArgs): TypedValue[] {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    let returnArgs: TypedValue[] = [
      new U64Value(new BigNumber(args.auctionId)),
      BytesValue.fromUTF8(collection),
      BytesValue.fromHex(nonce),
    ];
    if (args.quantity) {
      return [
        ...returnArgs,
        new OptionalValue(
          new BigUIntType(),
          new BigUIntValue(new BigNumber(args.quantity)),
        ),
      ];
    }

    return returnArgs;
  }

  private getCreateAuctionArgs(args: CreateAuctionRequest): TypedValue[] {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(collection),
      BytesValue.fromHex(nonce),
      new U64Value(new BigNumber(args.quantity)),
      new AddressValue(new Address(elrondConfig.nftMarketplaceAddress)),
      BytesValue.fromUTF8('auctionToken'),
      new BigUIntValue(new BigNumber(args.minBid)),
      new BigUIntValue(new BigNumber(args.maxBid || 0)),
      new U64Value(new BigNumber(args.deadline)),
      new TokenIdentifierValue(args.paymentToken),
      new OptionalValue(
        new BigUIntType(),
        new BigUIntValue(new BigNumber(elrondConfig.minimumBidDifference)),
      ),
    ];
    if (args.startDate) {
      return [
        ...returnArgs,
        new OptionalValue(
          new BooleanType(),
          new BooleanValue(args.maxOneSftPerPayment),
        ),
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.paymentTokenNonce)),
        ),
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.startDate)),
        ),
      ];
    }

    if (args.maxOneSftPerPayment) {
      return [
        ...returnArgs,
        new OptionalValue(
          new BooleanType(),
          new BooleanValue(args.maxOneSftPerPayment),
        ),
      ];
    }
    return returnArgs;
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
