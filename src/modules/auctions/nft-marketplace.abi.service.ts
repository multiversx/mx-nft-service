import {
  Address,
  BigUIntType,
  BigUIntValue,
  BooleanType,
  BooleanValue,
  BytesValue,
  OptionalValue,
  SmartContractController,
  SmartContractQuery,
  Token,
  TokenIdentifierValue,
  TokenTransfer,
  TransactionsFactoryConfig,
  TypedValue,
  U64Type,
  U64Value,
} from '@multiversx/sdk-core';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { MxApiService } from 'src/common';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getCollectionAndNonceFromIdentifier, numberToFixedHexBuffer } from 'src/utils/helpers';
import { gas, mxConfig } from '../../config';
import '../../utils/extensions';
import { NftTypeEnum } from '../assets/models';
import { TransactionNode } from '../common/transaction';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { Marketplace } from '../marketplaces/models';
import { CreateOfferRequest } from '../offers/models';
import { AcceptOfferRequest } from '../offers/models/AcceptOfferRequest';
import { OffersService } from '../offers/offers.service';
import { AuctionsGetterService } from './auctions-getter.service';
import { ContractLoader } from './contractLoader';
import { MarketplaceUtils } from './marketplaceUtils';
import { AuctionAbi, BuySftActionArgs, ExternalAuctionAbi } from './models';
import { BidRequest, BuySftRequest, CreateAuctionRequest } from './models/requests';

@Injectable()
export class NftMarketplaceAbiService {
  private config = new TransactionsFactoryConfig({ chainID: mxConfig.chainID });

  constructor(
    private readonly apiService: MxApiService,
    private readonly auctionsService: AuctionsGetterService,
    private readonly offersService: OffersService,
    private readonly logger: Logger,
    private readonly redisCacheService: RedisCacheService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async createAuction(ownerAddress: string, args: CreateAuctionRequest): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(args.identifier);
    const marketplace = await this.marketplaceService.getMarketplaceByKey(args.marketplaceKey);

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    if (marketplace.acceptedPaymentIdentifiers && !marketplace.acceptedPaymentIdentifiers.includes(args.paymentToken)) {
      throw new BadRequestError('Unaccepted payment token');
    }

    const factory = await ContractLoader.getFactory();
    const token = new Token({ identifier: collection, nonce: BigInt(parseInt(nonce, 16)) });
    const transfer = new TokenTransfer({ token, amount: BigInt(args.quantity) });
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplace.address),
      function: 'auctionToken',
      gasLimit: gas.startAuction,
      arguments: this.getCreateAuctionArgs(args),
      tokenTransfers: [transfer],
    });
    return transaction.toPlainObject();
  }

  async bid(ownerAddress: string, request: BidRequest): Promise<TransactionNode> {
    const { marketplaceAddress, auction } = await this.configureTransactionData(request.auctionId);
    if (request.paymentTokenIdentifier !== auction.paymentToken) throw new BadRequestError('Unaccepted payment token');

    return request.paymentTokenIdentifier !== mxConfig.egld
      ? await this.bidWithEsdt(ownerAddress, request, marketplaceAddress, auction.marketplaceAuctionId)
      : await this.bidWithEgld(ownerAddress, request, marketplaceAddress, auction.marketplaceAuctionId);
  }

  async withdraw(ownerAddress: string, auctionId: number): Promise<TransactionNode> {
    const { marketplaceAddress, auction } = await this.configureTransactionData(auctionId);
    const factory = await ContractLoader.getFactory();
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplaceAddress),
      function: 'withdraw',
      gasLimit: gas.withdraw,
      arguments: [new U64Value(new BigNumber(auction.marketplaceAuctionId))],
    });
    return transaction.toPlainObject();
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

    const factory = await ContractLoader.getFactory();
    if (request.paymentToken !== mxConfig.egld) {
      const token = new Token({ identifier: request.paymentToken });
      const transfer = new TokenTransfer({ token, amount: BigInt(request.paymentAmount) });

      const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
        contract: Address.newFromBech32(marketplace.address),
        function: 'sendOffer',
        gasLimit: gas.bid,
        arguments: await this.getCreateOfferArgs(collection, nonce, request),
        tokenTransfers: [transfer],
      });
      return transaction.toPlainObject();
    }
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplace.address),
      function: 'sendOffer',
      gasLimit: gas.bid,
      arguments: await this.getCreateOfferArgs(collection, nonce, request),
      nativeTransferAmount: BigInt(request.paymentAmount),
    });
    return transaction.toPlainObject();
  }

  async withdrawOffer(ownerAddress: string, offerId: number): Promise<TransactionNode> {
    const offer = await this.offersService.getOfferById(offerId);
    const marketplace = await this.marketplaceService.getMarketplaceByKey(offer?.marketplaceKey);

    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this collection');
    }

    const factory = await ContractLoader.getFactory();
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplace.address),
      function: 'withdrawOffer',
      gasLimit: gas.withdraw,
      arguments: [new U64Value(new BigNumber(offer.marketplaceOfferId))],
    });
    return transaction.toPlainObject();
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
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(asset.identifier);
    const factory = await ContractLoader.getFactory();
    const token = new Token({ identifier: collection, nonce: BigInt(parseInt(nonce, 16)) });
    const transfer = new TokenTransfer({
      token,
      amount: asset.type === NftTypeEnum.SemiFungibleESDT ? BigInt(offer.boughtTokensNo) : BigInt(1),
    });
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplace.address),
      function: 'acceptOffer',
      gasLimit: gas.withdraw,
      arguments: [new U64Value(new BigNumber(offer.marketplaceOfferId))],
      tokenTransfers: [transfer],
    });
    return transaction.toPlainObject();
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

    const factory = await ContractLoader.getFactory();
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplace.address),
      function: 'withdrawAuctionAndAcceptOffer',
      gasLimit: gas.withdraw,
      arguments: [new U64Value(new BigNumber(auction.marketplaceAuctionId)), new U64Value(new BigNumber(offer.marketplaceOfferId))],
    });
    return transaction.toPlainObject();
  }

  async endAuction(ownerAddress: string, auctionId: number): Promise<TransactionNode> {
    const { marketplaceAddress, auction } = await this.configureTransactionData(auctionId);
    const factory = await ContractLoader.getFactory();
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplaceAddress),
      function: 'endAuction',
      gasLimit: gas.endAuction,
      arguments: [new U64Value(new BigNumber(auction.marketplaceAuctionId))],
    });
    return transaction.toPlainObject();
  }

  async buySft(ownerAddress: string, request: BuySftRequest): Promise<TransactionNode> {
    const { marketplaceAddress, auction } = await this.configureTransactionData(request.auctionId);
    if (request.paymentTokenIdentifier !== auction.paymentToken) throw new BadRequestError('Unaccepted payment token');

    return request.paymentTokenIdentifier !== mxConfig.egld
      ? await this.buySftWithEsdt(ownerAddress, request, marketplaceAddress, auction.marketplaceAuctionId)
      : await this.buySftWithEgld(ownerAddress, request, marketplaceAddress, auction.marketplaceAuctionId);
  }

  async getAuctionQuery(auctionId: number, marketplace: Marketplace): Promise<AuctionAbi | ExternalAuctionAbi> {
    let controller: SmartContractController;
    if (MarketplaceUtils.isExternalMarketplace(marketplace.type)) {
      controller = await ContractLoader.getController(this.apiService.getService(), MarketplaceUtils.xoxnoMarketplaceAbiPath);
    } else {
      controller = await ContractLoader.getController(this.apiService.getService());
    }

    let getDataQuery = await controller.runQuery(
      new SmartContractQuery({
        contract: Address.newFromBech32(marketplace.address),
        function: 'getFullAuctionData',
        arguments: [numberToFixedHexBuffer(auctionId)],
      }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    const auction: AuctionAbi = response;
    return auction;
  }

  async getMinMaxAuction(auctionId: number, marketplace: Marketplace): Promise<[BigNumber, BigNumber]> {
    let controller: SmartContractController;
    if (!MarketplaceUtils.isExternalMarketplace(marketplace.type)) {
      return;
    }
    controller = await ContractLoader.getController(this.apiService.getService(), MarketplaceUtils.xoxnoMarketplaceAbiPath);

    let getDataQuery = await controller.runQuery(
      new SmartContractQuery({
        contract: Address.newFromBech32(marketplace.address),
        function: 'getMinMaxBid',
        arguments: [numberToFixedHexBuffer(auctionId)],
      }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    const [minBid, maxBid] = response.valueOf();
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

    return { marketplaceAddress, auction };
  }

  private async getCutPercentageMap(marketplacAddress: string): Promise<string> {
    let controller: SmartContractController = await ContractLoader.getController(this.apiService.getService());

    let getDataQuery = await controller.runQuery(
      new SmartContractQuery({
        contract: Address.newFromBech32(marketplacAddress),
        function: 'getMarketplaceCutPercentage',
        arguments: [],
      }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    return response.valueOf().toFixed();
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

  private async getIsPausedAbi(marketplacAddress: string): Promise<boolean> {
    let controller: SmartContractController = await ContractLoader.getController(this.apiService.getService());

    let getDataQuery = await controller.runQuery(
      new SmartContractQuery({ contract: Address.newFromBech32(marketplacAddress), function: 'isPaused', arguments: [] }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    return response.valueOf();
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

  private async bidWithEgld(
    ownerAddress: string,
    request: BidRequest,
    marketplaceAddress: string,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);
    const factory = await ContractLoader.getFactory();

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplaceAddress),
      function: 'bid',
      gasLimit: gas.bid,
      arguments: [new U64Value(new BigNumber(marketplaceAuctionId)), BytesValue.fromUTF8(collection), BytesValue.fromHex(nonce)],
      nativeTransferAmount: BigInt(request.price),
    });
    return transaction.toPlainObject();
  }

  private async bidWithEsdt(
    ownerAddress: string,
    request: BidRequest,
    marketplaceAddress: string,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);
    const factory = await ContractLoader.getFactory();

    const token = new Token({ identifier: request.paymentTokenIdentifier });
    const transfer = new TokenTransfer({ token, amount: BigInt(request.price) });
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplaceAddress),
      function: 'bid',
      gasLimit: gas.bid,
      arguments: [new U64Value(new BigNumber(marketplaceAuctionId)), BytesValue.fromUTF8(collection), BytesValue.fromHex(nonce)],
      tokenTransfers: [transfer],
    });
    return transaction.toPlainObject();
  }

  private async buySftWithEgld(
    ownerAddress: string,
    request: BuySftRequest,
    marketplaceAddress: string,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const factory = await ContractLoader.getFactory();
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplaceAddress),
      function: 'buySft',
      gasLimit: gas.buySft,
      arguments: this.getBuySftArguments(request, marketplaceAuctionId),
      nativeTransferAmount: BigInt(request.price),
    });
    return transaction.toPlainObject();
  }

  private async buySftWithEsdt(
    ownerAddress: string,
    request: BuySftRequest,
    marketplaceAddress: string,
    marketplaceAuctionId: number,
  ): Promise<TransactionNode> {
    const factory = await ContractLoader.getFactory();

    const token = new Token({ identifier: request.paymentTokenIdentifier });
    const transfer = new TokenTransfer({ token, amount: BigInt(request.price) });
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(marketplaceAddress),
      function: 'buySft',
      gasLimit: gas.buySft,
      arguments: this.getBuySftArguments(request, marketplaceAuctionId),
      tokenTransfers: [transfer],
    });
    return transaction.toPlainObject();
  }
}
