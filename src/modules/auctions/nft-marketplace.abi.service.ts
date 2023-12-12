import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import '../../utils/extensions';
import { AuctionAbi, BuySftActionArgs, ExternalAuctionAbi } from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
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
  TokenTransfer,
} from '@multiversx/sdk-core';
import { mxConfig, gas } from '../../config';
import { MxProxyService, getSmartContract, MxApiService } from 'src/common';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TransactionNode } from '../common/transaction';
import { BidRequest, BuySftRequest, CreateAuctionRequest } from './models/requests';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { AuctionsGetterService } from './auctions-getter.service';
import { MarketplaceUtils } from './marketplaceUtils';
import { Marketplace } from '../marketplaces/models';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { CreateOfferRequest } from '../offers/models';
import { OffersService } from '../offers/offers.service';
import { AcceptOfferRequest } from '../offers/models/AcceptOfferRequest';
import { NftTypeEnum } from '../assets/models';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { ContractLoader } from './contractLoader';

@Injectable()
export class NftMarketplaceAbiService {
  private readonly parser: ResultsParser;
  private contractLoader = new ContractLoader(MarketplaceUtils.commonMarketplaceAbiPath);

  constructor(
    private readonly mxProxyService: MxProxyService,
    private readonly apiService: MxApiService,
    private readonly auctionsService: AuctionsGetterService,
    private readonly offersService: OffersService,
    private readonly logger: Logger,
    private readonly redisCacheService: RedisCacheService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) {
    this.parser = new ResultsParser();
  }

  async createAuction(ownerAddress: string, args: CreateAuctionRequest): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(args.identifier);
    const marketplace = await this.marketplaceService.getMarketplaceByKey(args.marketplaceKey);

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const contract = await this.contractLoader.getContract(marketplace.address);
    if (marketplace.acceptedPaymentIdentifiers && !marketplace.acceptedPaymentIdentifiers.includes(args.paymentToken)) {
      throw new BadRequestError('Unaccepted payment token');
    }
    return contract.methodsExplicit
      .auctionToken(this.getCreateAuctionArgs(args))
      .withSingleESDTNFTTransfer(TokenTransfer.metaEsdtFromBigInteger(collection, parseInt(nonce, 16), new BigNumber(args.quantity)))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.startAuction)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async bid(ownerAddress: string, request: BidRequest): Promise<TransactionNode> {
    const { contract, auction } = await this.configureTransactionData(request.auctionId);
    if (request.paymentTokenIdentifier !== auction.paymentToken) throw new BadRequestError('Unaccepted payment token');

    return request.paymentTokenIdentifier !== mxConfig.egld
      ? await this.bidWithEsdt(ownerAddress, request, contract, auction.marketplaceAuctionId)
      : await this.bidWithEgld(ownerAddress, request, contract, auction.marketplaceAuctionId);
  }

  async withdraw(ownerAddress: string, auctionId: number): Promise<TransactionNode> {
    const { contract, auction } = await this.configureTransactionData(auctionId);

    return contract.methodsExplicit
      .withdraw([new U64Value(new BigNumber(auction.marketplaceAuctionId))])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.withdraw)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async createOffer(ownerAddress: string, request: CreateOfferRequest): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);
    const marketplace = await this.marketplaceService.getMarketplaceByKey(request.marketplaceKey);
    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    if (marketplace.acceptedPaymentIdentifiers && !marketplace.acceptedPaymentIdentifiers.includes(request.paymentToken)) {
      throw new BadRequestError('Unaccepted payment token');
    }

    const contract = await this.contractLoader.getContract(marketplace.address);
    const intermediateInteraction = await this.getGenericOfferInteraction(contract, collection, nonce, request);

    if (request.paymentToken !== mxConfig.egld) {
      return intermediateInteraction
        .withSingleESDTTransfer(TokenTransfer.fungibleFromBigInteger(request.paymentToken, new BigNumber(request.paymentAmount)))
        .withSender(Address.fromString(ownerAddress))
        .buildTransaction()
        .toPlainObject();
    }
    return intermediateInteraction
      .withValue(TokenTransfer.egldFromBigInteger(request.paymentAmount))
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  private async getGenericOfferInteraction(
    contract: SmartContract,
    collection: string,
    nonce: string,
    request: CreateOfferRequest,
  ): Promise<Interaction> {
    return contract.methodsExplicit
      .sendOffer(await this.getCreateOfferArgs(collection, nonce, request))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.bid);
  }

  async withdrawOffer(ownerAddress: string, offerId: number): Promise<TransactionNode> {
    const offer = await this.offersService.getOfferById(offerId);
    const marketplace = await this.marketplaceService.getMarketplaceByKey(offer?.marketplaceKey);

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const contract = await this.contractLoader.getContract(marketplace.address);
    return contract.methodsExplicit
      .withdrawOffer([new U64Value(new BigNumber(offer.marketplaceOfferId))])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.withdraw)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async acceptOffer(ownerAddress: string, request: AcceptOfferRequest): Promise<TransactionNode> {
    if (request.auctionId) {
      return this.acceptOfferAndWithdrawAuction(ownerAddress, request.offerId, request.auctionId);
    }
    return this.acceptSingleOffer(ownerAddress, request.offerId);
  }

  private async acceptSingleOffer(ownerAddress: string, offerId: number): Promise<TransactionNode> {
    const offer = await this.offersService.getOfferById(offerId);

    if (!offer) {
      return;
    }

    const marketplace = await this.marketplaceService.getMarketplaceByKey(offer.collection);

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const asset = await this.apiService.getNftByIdentifierAndAddress(ownerAddress, offer.identifier);
    if (!asset) {
      throw new BadRequestError('You do not own this nft!');
    }

    if (asset.type === NftTypeEnum.SemiFungibleESDT && parseInt(asset.balance) < parseInt(offer.boughtTokensNo)) {
      throw new BadRequestError('Not enough balance to accept this offer!');
    }

    const contract = await this.contractLoader.getContract(marketplace.address);
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(asset.identifier);
    return contract.methodsExplicit
      .acceptOffer([new U64Value(new BigNumber(offer.marketplaceOfferId))])
      .withSingleESDTNFTTransfer(
        TokenTransfer.metaEsdtFromBigInteger(
          collection,
          parseInt(nonce, 16),
          asset.type === NftTypeEnum.SemiFungibleESDT ? new BigNumber(offer.boughtTokensNo) : new BigNumber(1),
        ),
      )
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.withdraw)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  private async acceptOfferAndWithdrawAuction(ownerAddress: string, offerId: number, auctionId: number): Promise<TransactionNode> {
    const offer = await this.offersService.getOfferById(offerId);
    const auction = await this.auctionsService.getAuctionById(auctionId);
    if (!offer || !auction || ownerAddress !== auction?.ownerAddress) {
      throw new BadRequestError('No offer/auction available');
    }

    const marketplace = await this.marketplaceService.getMarketplaceByKey(offer.collection);

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const contract = await this.contractLoader.getContract(marketplace.address);
    return contract.methodsExplicit
      .withdrawAuctionAndAcceptOffer([
        new U64Value(new BigNumber(auction.marketplaceAuctionId)),
        new U64Value(new BigNumber(offer.marketplaceOfferId)),
      ])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.withdraw)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async endAuction(ownerAddress: string, auctionId: number): Promise<TransactionNode> {
    const { contract, auction } = await this.configureTransactionData(auctionId);

    return contract.methodsExplicit
      .endAuction([new U64Value(new BigNumber(auction.marketplaceAuctionId))])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.endAuction)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async buySft(ownerAddress: string, request: BuySftRequest): Promise<TransactionNode> {
    const { contract, auction } = await this.configureTransactionData(request.auctionId);
    if (request.paymentTokenIdentifier !== auction.paymentToken) throw new BadRequestError('Unaccepted payment token');

    return request.paymentTokenIdentifier !== mxConfig.egld
      ? await this.buySftWithEsdt(ownerAddress, request, contract, auction.marketplaceAuctionId)
      : await this.buySftWithEgld(ownerAddress, request, contract, auction.marketplaceAuctionId);
  }

  async getAuctionQuery(auctionId: number, marketplace: Marketplace): Promise<AuctionAbi | ExternalAuctionAbi> {
    let scContract: SmartContract;
    if (MarketplaceUtils.isExternalMarketplace(marketplace.type)) {
      this.contractLoader = new ContractLoader(MarketplaceUtils.xoxnoMarketplaceAbiPath);
      scContract = await this.contractLoader.getContract(marketplace.address);
    } else {
      const contract = new ContractLoader(MarketplaceUtils.commonMarketplaceAbiPath);
      scContract = await contract.getContract(marketplace.address);
    }
    let getDataQuery = <Interaction>scContract.methodsExplicit.getFullAuctionData([new U64Value(new BigNumber(auctionId))]);

    const response = await this.getFirstQueryResult(getDataQuery);

    const auction: AuctionAbi = response?.firstValue?.valueOf();
    return auction;
  }

  async getMinMaxAuction(auctionId: number, marketplace: Marketplace): Promise<[BigNumber, BigNumber]> {
    let scContract: SmartContract;
    if (!MarketplaceUtils.isExternalMarketplace(marketplace.type)) {
      return;
    }

    this.contractLoader = new ContractLoader(MarketplaceUtils.xoxnoMarketplaceAbiPath);
    scContract = await this.contractLoader.getContract(marketplace.address);

    let getDataQuery = <Interaction>scContract.methodsExplicit.getMinMaxBid([new U64Value(new BigNumber(auctionId))]);

    const response = await this.getFirstQueryResult(getDataQuery);

    const [minBid, maxBid] = response?.firstValue?.valueOf();
    return [minBid, maxBid];
  }

  async getCutPercentage(contractAddress: string): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams('marketplaceCutPercentage', contractAddress);
      return await this.redisCacheService.getOrSet(cacheKey, () => this.getCutPercentageMap(contractAddress), Constants.oneWeek());
    } catch (err) {
      this.logger.error('An error occurred while getting the marketplace cut percentage.', {
        path: 'NftMarketplaceAbiService.getCutPercentage',
        exception: err,
      });
    }
  }

  async getIsPaused(contractAddress: string): Promise<boolean> {
    try {
      return await this.redisCacheService.getOrSet(
        generateCacheKeyFromParams('isPaused', contractAddress),
        () => this.getIsPausedAbi(contractAddress),
        Constants.oneWeek(),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting the is Paused value.', {
        path: 'NftMarketplaceAbiService.getIsPaused',
        exception: err,
      });
    }
  }

  private async configureTransactionData(auctionId: number) {
    const auction = await this.auctionsService.getAuctionById(auctionId);
    const marketplaceAddress = await this.marketplaceService.getMarketplaceAddressByKey(auction.marketplaceKey);

    const contract = await this.contractLoader.getContract(marketplaceAddress);
    return { contract, auction };
  }

  private async getCutPercentageMap(contractAddress: string): Promise<string> {
    const contract = await this.contractLoader.getContract(contractAddress);
    let getDataQuery = <Interaction>contract.methodsExplicit.getMarketplaceCutPercentage();
    const response = await this.getFirstQueryResult(getDataQuery);
    return response.firstValue.valueOf().toFixed();
  }

  private async getCreateOfferArgs(collection: string, nonce: string, request: CreateOfferRequest): Promise<TypedValue[]> {
    let auction = null;
    if (request.auctionId) {
      auction = await this.auctionsService.getAuctionById(request.auctionId);
      if (!auction) {
        throw new BadRequestError('No auction with the specified id!');
      }
    }

    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(collection),
      BytesValue.fromHex(nonce),
      new BigUIntValue(new BigNumber(request.quantity)),
      new U64Value(new BigNumber(request.deadline)),
    ];
    if (auction) {
      returnArgs.push(new U64Value(new BigNumber(auction.marketplaceAuctionId)));
    }
    return returnArgs;
  }

  private async getIsPausedAbi(contractAddress: string): Promise<boolean> {
    const contract = await this.contractLoader.getContract(contractAddress);
    let getDataQuery = <Interaction>contract.methodsExplicit.isPaused();
    const response = await this.getFirstQueryResult(getDataQuery);
    return response.firstValue.valueOf();
  }

  private getBuySftArguments(args: BuySftActionArgs, auctionId: number): TypedValue[] {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(args.identifier);
    let returnArgs: TypedValue[] = [new U64Value(new BigNumber(auctionId)), BytesValue.fromUTF8(collection), BytesValue.fromHex(nonce)];
    if (args.quantity) {
      return [...returnArgs, new OptionalValue(new BigUIntType(), new BigUIntValue(new BigNumber(args.quantity)))];
    }

    return returnArgs;
  }

  private getCreateAuctionArgs(args: CreateAuctionRequest): TypedValue[] {
    let returnArgs: TypedValue[] = [
      new BigUIntValue(new BigNumber(args.minBid)),
      new BigUIntValue(new BigNumber(args.maxBid || 0)),
      new U64Value(new BigNumber(args.deadline)),
      new TokenIdentifierValue(args.paymentToken),
      new OptionalValue(new BigUIntType(), new BigUIntValue(new BigNumber(mxConfig.minimumBidDifference))),
    ];
    if (args.startDate) {
      return [
        ...returnArgs,
        new OptionalValue(new BooleanType(), new BooleanValue(args.maxOneSftPerPayment)),
        new OptionalValue(new U64Type(), new U64Value(new BigNumber(args.paymentTokenNonce ?? 0))),
        new OptionalValue(new U64Type(), new U64Value(new BigNumber(args.startDate))),
      ];
    }

    if (args.maxOneSftPerPayment) {
      return [...returnArgs, new OptionalValue(new BooleanType(), new BooleanValue(args.maxOneSftPerPayment))];
    }
    return returnArgs;
  }

  private async getFirstQueryResult(interaction: Interaction) {
    let queryResponse = await this.mxProxyService.getService().queryContract(interaction.buildQuery());
    let result = this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    return result;
  }

  private async bidWithEgld(
    ownerAddress: string,
    request: BidRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);
    return contract.methodsExplicit
      .bid([new U64Value(new BigNumber(marketplaceAuctionId)), BytesValue.fromUTF8(collection), BytesValue.fromHex(nonce)])
      .withValue(TokenTransfer.egldFromBigInteger(request.price))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.bid)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  private async bidWithEsdt(
    ownerAddress: string,
    request: BidRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);

    return contract.methodsExplicit
      .bid([new U64Value(new BigNumber(marketplaceAuctionId)), BytesValue.fromUTF8(collection), BytesValue.fromHex(nonce)])
      .withSingleESDTTransfer(TokenTransfer.fungibleFromBigInteger(request.paymentTokenIdentifier, new BigNumber(request.price)))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.bid)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  private async buySftWithEgld(
    ownerAddress: string,
    request: BuySftRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    return contract.methodsExplicit
      .buySft(this.getBuySftArguments(request, marketplaceAuctionId))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.buySft)
      .withValue(TokenTransfer.egldFromBigInteger(request.price))
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  private async buySftWithEsdt(
    ownerAddress: string,
    request: BuySftRequest,
    contract: SmartContract,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    return contract.methodsExplicit
      .buySft(this.getBuySftArguments(request, marketplaceAuctionId))
      .withSingleESDTTransfer(TokenTransfer.fungibleFromBigInteger(request.paymentTokenIdentifier, new BigNumber(request.price)))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.buySft)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }
}
