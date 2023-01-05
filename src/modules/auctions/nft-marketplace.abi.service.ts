import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import { AuctionAbi, BuySftActionArgs, ExternalAuctionAbi } from './models';
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
  SmartContract,
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
import { MarketplaceUtils } from './marketplaceUtils';
import { Marketplace } from '../marketplaces/models';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { CreateOfferRequest } from '../offers/models';
import { OffersService } from '../offers/offers.service';
import { AcceptOfferRequest } from '../offers/models/AcceptOfferRequest';
import { AssetsGetterService } from '../assets';

@Injectable()
export class NftMarketplaceAbiService {
  private redisClient: Redis.Redis;
  private readonly parser: ResultsParser;

  private contract = new ContractLoader(
    MarketplaceUtils.commonMarketplaceAbiPath,
    MarketplaceUtils.abiInterface,
  );

  constructor(
    private elrondProxyService: ElrondProxyService,
    private auctionsService: AuctionsGetterService,
    private offersService: OffersService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
    private marketplaceService: MarketplacesService,
    private assetsService: AssetsGetterService,
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

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    if (
      marketplace.acceptedPaymentIdentifiers &&
      !marketplace.acceptedPaymentIdentifiers.includes(args.paymentToken)
    ) {
      throw new BadRequestError('Unaccepted payment token');
    }

    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: TokenPayment.egldFromAmount(0),
      args: this.getCreateAuctionArgs(args, marketplace.address),
      gasLimit: gas.startAuction,
      chainID: elrondConfig.chainID,
    });
    return createAuctionTx.toPlainObject(new Address(ownerAddress));
  }

  async bid(
    ownerAddress: string,
    request: BidRequest,
  ): Promise<TransactionNode> {
    const { contract, auction } = await this.configureTransactionData(
      request.auctionId,
    );
    if (request.paymentTokenIdentifier !== auction.paymentToken)
      throw new BadRequestError('Unaccepted payment token');

    return request.paymentTokenIdentifier !== elrondConfig.egld
      ? await this.bidWithEsdt(
          ownerAddress,
          request,
          contract,
          auction.marketplaceAuctionId,
        )
      : await this.bidWithEgld(
          ownerAddress,
          request,
          contract,
          auction.marketplaceAuctionId,
        );
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

  async createOffer(
    ownerAddress: string,
    request: CreateOfferRequest,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      request.identifier,
    );
    const marketplace =
      await this.marketplaceService.getMarketplaceByCollection(collection);
    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const contract = await this.contract.getContract(marketplace.address);
    return contract.methodsExplicit
      .sendOffer(
        await this.getCreateOfferArgs(
          collection,
          nonce,
          request,
          marketplace.key,
        ),
      )
      .withValue(TokenPayment.egldFromBigInteger(request.paymentAmount))
      .withChainID(elrondConfig.chainID)
      .withGasLimit(gas.bid)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
  }

  async withdrawOffer(
    ownerAddress: string,
    offerId: number,
  ): Promise<TransactionNode> {
    const offer = await this.offersService.getOfferById(offerId);
    const marketplace =
      await this.marketplaceService.getMarketplaceByCollection(
        offer?.collection,
      );

    if (!marketplace) {
      return;
    }
    const contract = await this.contract.getContract(marketplace.address);
    return contract.methodsExplicit
      .withdrawOffer([new U64Value(new BigNumber(offer.marketplaceOfferId))])
      .withValue(TokenPayment.egldFromAmount(0))
      .withChainID(elrondConfig.chainID)
      .withGasLimit(gas.withdraw)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
  }

  async acceptOffer(
    ownerAddress: string,
    request: AcceptOfferRequest,
  ): Promise<TransactionNode> {
    if (request.auctionId) {
      return this.acceptOfferAndWithdrawAuction(
        ownerAddress,
        request.offerId,
        request.auctionId,
      );
    }
    return this.acceptSingleOffer(ownerAddress, request.offerId);
  }

  private async acceptSingleOffer(
    ownerAddress: string,
    offerId: number,
  ): Promise<TransactionNode> {
    const offer = await this.offersService.getOfferById(offerId);

    if (!offer) {
      return;
    }

    const marketplace =
      await this.marketplaceService.getMarketplaceByCollection(
        offer.collection,
      );

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const asset = await this.assetsService.getAssetByIdentifierAndAddress(
      ownerAddress,
      offer.identifier,
    );
    if (!asset) {
      throw new BadRequestError('You do not own this nft!');
    }

    const contract = await this.contract.getContract(marketplace.address);
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      asset.identifier,
    );
    return contract.methodsExplicit
      .acceptOffer([new U64Value(new BigNumber(offer.marketplaceOfferId))])
      .withSingleESDTNFTTransfer(
        TokenPayment.metaEsdtFromBigInteger(
          collection,
          parseInt(nonce),
          asset.balance ? new BigNumber(asset.balance) : new BigNumber(1),
        ),
        Address.fromString(offer.ownerAddress),
      )
      .withChainID(elrondConfig.chainID)
      .withGasLimit(gas.withdraw)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
  }

  private async acceptOfferAndWithdrawAuction(
    ownerAddress: string,
    offerId: number,
    auctionId: number,
  ): Promise<TransactionNode> {
    const offer = await this.offersService.getOfferById(offerId);
    const auction = await this.auctionsService.getAuctionById(auctionId);
    if (!offer || !auction || ownerAddress !== auction?.ownerAddress) {
      return;
    }

    const marketplace =
      await this.marketplaceService.getMarketplaceByCollection(
        offer.collection,
      );

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const contract = await this.contract.getContract(marketplace.address);
    return contract.methodsExplicit
      .withdrawAuctionAndAcceptOffer([
        new U64Value(new BigNumber(auction.marketplaceAuctionId)),
        new U64Value(new BigNumber(offer.marketplaceOfferId)),
      ])
      .withValue(TokenPayment.egldFromAmount(0))
      .withChainID(elrondConfig.chainID)
      .withGasLimit(gas.withdraw)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
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
    if (request.paymentTokenIdentifier !== auction.paymentToken)
      throw new BadRequestError('Unaccepted payment token');

    return request.paymentTokenIdentifier !== elrondConfig.egld
      ? await this.buySftWithEsdt(
          ownerAddress,
          request,
          contract,
          auction.marketplaceAuctionId,
        )
      : await this.buySftWithEgld(
          ownerAddress,
          request,
          contract,
          auction.marketplaceAuctionId,
        );
  }

  async getAuctionQuery(
    auctionId: number,
    marketplace: Marketplace,
  ): Promise<AuctionAbi | ExternalAuctionAbi> {
    let scContract: SmartContract;
    if (MarketplaceUtils.isExternalMarketplace(marketplace.type)) {
      this.contract = new ContractLoader(
        MarketplaceUtils.xoxnoMarketplaceAbiPath,
        MarketplaceUtils.abiInterface,
      );
      scContract = await this.contract.getContract(marketplace.address);
    } else {
      const contract = new ContractLoader(
        MarketplaceUtils.commonMarketplaceAbiPath,
        MarketplaceUtils.abiInterface,
      );
      scContract = await contract.getContract(marketplace.address);
    }
    let getDataQuery = <Interaction>(
      scContract.methodsExplicit.getFullAuctionData([
        new U64Value(new BigNumber(auctionId)),
      ])
    );

    const response = await this.getFirstQueryResult(getDataQuery);

    const auction: AuctionAbi = response?.firstValue?.valueOf();
    return auction;
  }

  async getMinMaxAuction(
    auctionId: number,
    marketplace: Marketplace,
  ): Promise<[BigNumber, BigNumber]> {
    let scContract: SmartContract;
    if (!MarketplaceUtils.isExternalMarketplace(marketplace.type)) {
      return;
    }
    this.contract = new ContractLoader(
      MarketplaceUtils.xoxnoMarketplaceAbiPath,
      MarketplaceUtils.abiInterface,
    );
    scContract = await this.contract.getContract(marketplace.address);

    let getDataQuery = <Interaction>(
      scContract.methodsExplicit.getMinMaxBid([
        new U64Value(new BigNumber(auctionId)),
      ])
    );

    const response = await this.getFirstQueryResult(getDataQuery);

    const [minBid, maxBid] = response?.firstValue?.valueOf();
    return [minBid, maxBid];
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

  private async getCreateOfferArgs(
    collection: string,
    nonce: string,
    request: CreateOfferRequest,
    marketplaceKey: string,
  ): Promise<TypedValue[]> {
    const auction =
      await this.auctionsService.getAuctionByIdentifierAndMarketplace(
        request.identifier,
        marketplaceKey,
      );
    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(collection),
      BytesValue.fromHex(nonce),
      new BigUIntValue(new BigNumber(request.quantity)),
      new U64Value(new BigNumber(request.deadline)),
    ];
    if (auction) {
      returnArgs.push(
        new U64Value(new BigNumber(auction?.marketplaceAuctionId)),
      );
    }
    return returnArgs;
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

  private async bidWithEgld(
    ownerAddress: string,
    request: BidRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      request.identifier,
    );

    return contract
      .call({
        func: new ContractFunction('bid'),
        value: TokenPayment.egldFromBigInteger(request.price),
        args: [
          new U64Value(new BigNumber(marketplaceAuctionId)),
          BytesValue.fromUTF8(collection),
          BytesValue.fromHex(nonce),
        ],
        gasLimit: gas.bid,
        chainID: elrondConfig.chainID,
      })
      .toPlainObject(new Address(ownerAddress));
  }

  private async bidWithEsdt(
    ownerAddress: string,
    request: BidRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      request.identifier,
    );

    return contract.methodsExplicit
      .bid([
        new U64Value(new BigNumber(marketplaceAuctionId)),
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
      ])
      .withSingleESDTTransfer(
        TokenPayment.fungibleFromBigInteger(
          request.paymentTokenIdentifier,
          new BigNumber(request.price),
        ),
      )
      .withChainID(elrondConfig.chainID)
      .withGasLimit(gas.bid)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
  }

  private async buySftWithEgld(
    ownerAddress: string,
    request: BuySftRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    return contract
      .call({
        func: new ContractFunction('buySft'),
        value: TokenPayment.egldFromBigInteger(request.price),
        args: this.getBuySftArguments(request, marketplaceAuctionId),
        gasLimit: gas.buySft,
        chainID: elrondConfig.chainID,
      })
      .toPlainObject(new Address(ownerAddress));
  }

  private async buySftWithEsdt(
    ownerAddress: string,
    request: BuySftRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    return contract.methodsExplicit
      .buySft(this.getBuySftArguments(request, marketplaceAuctionId))
      .withSingleESDTTransfer(
        TokenPayment.fungibleFromBigInteger(
          request.paymentTokenIdentifier,
          new BigNumber(request.price),
        ),
      )
      .withChainID(elrondConfig.chainID)
      .withGasLimit(gas.buySft)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
  }
}
