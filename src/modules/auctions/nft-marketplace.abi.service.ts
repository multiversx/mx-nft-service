import { Injectable, Logger } from '@nestjs/common';
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
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TransactionNode } from '../common/transaction';
import { TimeConstants } from 'src/utils/time-utils';
import {
  BidRequest,
  BuySftRequest,
  CreateAuctionRequest,
} from './models/requests';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { AuctionsGetterService } from './auctions-getter.service';
import { ContractLoader } from '@elrondnetwork/erdnest/lib/src/sc.interactions/contract.loader';

@Injectable()
export class NftMarketplaceAbiService {
  private redisClient: Redis.Redis;
  private readonly parser: ResultsParser;
  private readonly abiPath: string = './src/abis/esdt-nft-marketplace.abi.json';
  private readonly abiInterface: string = 'EsdtNftMarketplace';
  private readonly contract = new ContractLoader(
    this.abiPath,
    this.abiInterface,
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

  async createAuction(
    ownerAddress: string,
    args: CreateAuctionRequest,
  ): Promise<TransactionNode> {
    const contract = getSmartContract(ownerAddress);
    const { collection } = getCollectionAndNonceFromIdentifier(args.identifier);
    const marketplace =
      await this.marketplaceService.getMarketplaceByCollection(collection);
    if (marketplace) {
      let createAuctionTx = contract.call({
        func: new ContractFunction('ESDTNFTTransfer'),
        value: TokenPayment.egldFromAmount(0),
        args: this.getCreateAuctionArgs(args, marketplace.address),
        gasLimit: gas.startAuction,
        chainID: elrondConfig.chainID,
      });
      return createAuctionTx.toPlainObject(new Address(ownerAddress));
    }
  }

  async bid(
    ownerAddress: string,
    request: BidRequest,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      request.identifier,
    );
    const { contract, auction } = await this.configureTransactionData(
      request.auctionId,
    );
    let bid = contract.call({
      func: new ContractFunction('bid'),
      value: TokenPayment.egldFromBigInteger(request.price),
      args: [
        new U64Value(new BigNumber(auction.marketplaceAuctionId)),
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
    const { contract, auction } = await this.configureTransactionData(
      auctionId,
    );

    let withdraw = contract.call({
      func: new ContractFunction('withdraw'),
      value: TokenPayment.egldFromAmount(0),
      args: [new U64Value(new BigNumber(auction.marketplaceAuctionId))],
      gasLimit: gas.withdraw,
      chainID: elrondConfig.chainID,
    });
    return withdraw.toPlainObject(new Address(ownerAddress));
  }

  async endAuction(
    ownerAddress: string,
    auctionId: number,
  ): Promise<TransactionNode> {
    const { contract, auction } = await this.configureTransactionData(
      auctionId,
    );

    let endAuction = contract.call({
      func: new ContractFunction('endAuction'),
      value: TokenPayment.egldFromAmount(0),
      args: [new U64Value(new BigNumber(auction.marketplaceAuctionId))],
      gasLimit: gas.endAuction,
      chainID: elrondConfig.chainID,
    });

    return endAuction.toPlainObject(new Address(ownerAddress));
  }

  async buySft(
    ownerAddress: string,
    request: BuySftRequest,
  ): Promise<TransactionNode> {
    const { contract, auction } = await this.configureTransactionData(
      request.auctionId,
    );

    let buySftAfterEndAuction = contract.call({
      func: new ContractFunction('buySft'),
      value: TokenPayment.egldFromBigInteger(request.price),
      args: this.getBuySftArguments(request, auction.marketplaceAuctionId),
      gasLimit: gas.buySft,
      chainID: elrondConfig.chainID,
    });
    return buySftAfterEndAuction.toPlainObject(new Address(ownerAddress));
  }

  async getAuctionQuery(
    contractAddress: string,
    auctionId: number,
  ): Promise<AuctionAbi> {
    const contract = await this.contract.getContract(contractAddress);

    let getDataQuery = <Interaction>(
      contract.methodsExplicit.getFullAuctionData([
        new U64Value(new BigNumber(auctionId)),
      ])
    );

    const response = await this.getFirstQueryResult(getDataQuery);

    const auction: AuctionAbi = response?.firstValue?.valueOf();
    return auction;
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

  private async configureTransactionData(auctionId: number) {
    const auction = await this.auctionsService.getAuctionById(auctionId);
    const marketplaceAddress =
      await this.marketplaceService.getInternalMarketplacesAddresesByKey(
        auction.marketplaceKey,
      );

    const contract = await this.contract.getContract(marketplaceAddress);
    return { contract, auction };
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

  private getBuySftArguments(
    args: BuySftActionArgs,
    auctionId: number,
  ): TypedValue[] {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    let returnArgs: TypedValue[] = [
      new U64Value(new BigNumber(auctionId)),
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

  private getCreateAuctionArgs(
    args: CreateAuctionRequest,
    address: string,
  ): TypedValue[] {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(collection),
      BytesValue.fromHex(nonce),
      new U64Value(new BigNumber(args.quantity)),
      new AddressValue(new Address(address)),
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
