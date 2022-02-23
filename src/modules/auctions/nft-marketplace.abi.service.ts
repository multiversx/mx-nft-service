import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import {
  CreateAuctionArgs,
  AuctionAbi,
  BidActionArgs,
  BuySftActionArgs,
} from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
  AddressValue,
  Balance,
  BigUIntValue,
  BooleanType,
  BooleanValue,
  BytesValue,
  ContractFunction,
  GasLimit,
  Interaction,
  OptionalValue,
  SmartContract,
  TokenIdentifierValue,
  TypedValue,
  U64Type,
  U64Value,
  ChainID,
  NetworkConfig,
  BigUIntType,
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

@Injectable()
export class NftMarketplaceAbiService {
  private redisClient: Redis.Redis;
  constructor(
    private elrondProxyService: ElrondProxyService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
    let defaultNetworkConfig = NetworkConfig.getDefault();
    defaultNetworkConfig.ChainID = new ChainID(elrondConfig.chainID);
  }

  async createAuction(
    ownerAddress: string,
    args: CreateAuctionArgs,
  ): Promise<TransactionNode> {
    const contract = getSmartContract(ownerAddress);

    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: this.getCreateAuctionArgs(args),
      gasLimit: new GasLimit(gas.startAuction),
    });
    return createAuctionTx.toPlainObject(new Address(ownerAddress));
  }

  async bid(
    ownerAddress: string,
    args: BidActionArgs,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let bid = contract.call({
      func: new ContractFunction('bid'),
      value: Balance.fromString(args.price),
      args: [
        new U64Value(new BigNumber(args.auctionId)),
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
      ],
      gasLimit: new GasLimit(gas.bid),
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }

  async withdraw(
    ownerAddress: string,
    auctionId: number,
  ): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getAbiSmartContract();

    let withdraw = contract.call({
      func: new ContractFunction('withdraw'),
      value: Balance.egld(0),
      args: [new U64Value(new BigNumber(auctionId))],
      gasLimit: new GasLimit(gas.withdraw),
    });
    return withdraw.toPlainObject(new Address(ownerAddress));
  }

  async endAuction(
    ownerAddress: string,
    auctionId: number,
  ): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let endAuction = contract.call({
      func: new ContractFunction('endAuction'),
      value: Balance.egld(0),
      args: [new U64Value(new BigNumber(auctionId))],
      gasLimit: new GasLimit(gas.endAuction),
    });

    return endAuction.toPlainObject(new Address(ownerAddress));
  }

  async buySft(
    ownerAddress: string,
    args: BuySftActionArgs,
  ): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getAbiSmartContract();

    let buySftAfterEndAuction = contract.call({
      func: new ContractFunction('buySft'),
      value: Balance.fromString(args.price),
      args: this.getBuySftArguments(args),
      gasLimit: new GasLimit(gas.buySft),
    });
    return buySftAfterEndAuction.toPlainObject(new Address(ownerAddress));
  }

  async getAuctionQuery(auctionId: number): Promise<AuctionAbi> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getFullAuctionData([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );
    let result = getDataQuery.interpretQueryResponse(data);

    const auction: AuctionAbi = result?.firstValue?.valueOf();
    return auction;
  }

  async getAuctionStatus(auctionId: string): Promise<AuctionAbi> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getAuctionStatus([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );
    let result = getDataQuery.interpretQueryResponse(data);

    const auction: AuctionAbi = result.firstValue.valueOf();
    return auction;
  }

  async getOriginalOwner(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getOriginalOwner([
        new U64Value(new BigNumber(auctionId)),
      ])
    );

    const response = await this.getFirstQueryResult(contract, getDataQuery);
    return response.firstValue.valueOf();
  }

  async getDeadline(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getDeadline([new U64Value(new BigNumber(auctionId))])
    );
    const response = await this.getFirstQueryResult(contract, getDataQuery);
    return response.firstValue.valueOf();
  }

  async getMinMaxBid(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getMinMaxBid([new U64Value(new BigNumber(auctionId))])
    );
    const response = await this.getFirstQueryResult(contract, getDataQuery);
    return response.firstValue.valueOf();
  }

  async getCurrentWinningBid(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getCurrentWinningBid([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    const response = await this.getFirstQueryResult(contract, getDataQuery);
    return response.firstValue.valueOf();
  }

  async getCurrentWinner(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getCurrentWinner([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    const response = await this.getFirstQueryResult(contract, getDataQuery);
    return response.firstValue.valueOf();
  }

  async getCutPercentage(): Promise<string> {
    try {
      const cacheKey = this.getMarketplaceCutPercentageCacheKey();
      const getAssetLiked = () => this.getCutPercentageMap();
      const cutPercentage = await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAssetLiked,
        cacheConfig.followersttl,
      );

      return cutPercentage;
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

  private async getCutPercentageMap(): Promise<string> {
    const contract = await this.elrondProxyService.getAbiSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getMarketplaceCutPercentage()
    );
    const response = await this.getFirstQueryResult(contract, getDataQuery);
    return response.firstValue.valueOf().toFixed();
  }

  private getMarketplaceCutPercentageCacheKey() {
    return generateCacheKeyFromParams('marketplaceCutPercentage');
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

  private getCreateAuctionArgs(args: CreateAuctionArgs): TypedValue[] {
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
      new TokenIdentifierValue(Buffer.from(args.paymentToken)),
    ];

    if (args.startDate) {
      return [
        ...returnArgs,
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.paymentTokenNonce)),
        ),
        new OptionalValue(
          new BooleanType(),
          new BooleanValue(args.maxOneSftPerPayment),
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
          new U64Type(),
          new U64Value(new BigNumber(args.paymentTokenNonce || 0)),
        ),
        new OptionalValue(
          new BooleanType(),
          new BooleanValue(args.maxOneSftPerPayment),
        ),
      ];
    }
    return returnArgs;
  }

  private async getFirstQueryResult(
    contract: SmartContract,
    interaction: Interaction,
  ) {
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      interaction.buildQuery(),
    );

    let result = interaction.interpretQueryResponse(data);
    return result;
  }
}
