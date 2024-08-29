import { Test, TestingModule } from '@nestjs/testing';
import { NftMarketplaceAbiService } from '../nft-marketplace.abi.service';
import { MxApiService, MxProxyService } from 'src/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Logger } from '@nestjs/common';
import { OffersService } from 'src/modules/offers/offers.service';
import { AuctionsGetterService } from '../auctions-getter.service';
import { BidRequest, BuySftRequest, CreateAuctionRequest } from '../models/requests';
import { CreateOfferRequest } from 'src/modules/offers/models';
import { AcceptOfferRequest } from 'src/modules/offers/models/AcceptOfferRequest';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { AuctionEntity } from 'src/db/auctions';
import { OfferEntity } from 'src/db/offers';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { NftTypeEnum } from 'src/modules/assets/models';

describe('Nft Marketplace Abi Service', () => {
  let service: NftMarketplaceAbiService;
  let module: TestingModule;
  const auctionWithEsdtPaymentToken = new AuctionEntity({
    marketplaceAuctionId: 1,
    paymentToken: 'ESDT',
    ownerAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
  });
  const auctionWithEGLDPaymentToken = new AuctionEntity({
    marketplaceAuctionId: 1,
    paymentToken: 'EGLD',
    ownerAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
  });
  const marketplace = new Marketplace({
    address: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
    name: 'name',
    key: 'xoxno',
  });

  const ownerAddress = 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha';
  const marketplaceWithESDTPaymentTokens = new Marketplace({
    address: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
    name: 'name',
    key: 'xoxno',
    acceptedPaymentIdentifiers: ['ESDT'],
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        NftMarketplaceAbiService,
        {
          provide: MxProxyService,
          useValue: {},
        },
        {
          provide: MxApiService,
          useValue: {},
        },
        {
          provide: AuctionsGetterService,
          useValue: {},
        },
        {
          provide: OffersService,
          useValue: {
            getOfferById: jest.fn(),
          },
        },
        {
          provide: MarketplacesService,
          useValue: {},
        },
        {
          provide: RedisCacheService,
          useValue: {},
        },
        {
          provide: Logger,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<NftMarketplaceAbiService>(NftMarketplaceAbiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAuction', () => {
    const createAuctionRequestWithEgld = new CreateAuctionRequest({
      identifier: 'GEN-8984e7-07',
      minBid: '1000000000',
      maxBid: '11111111',
      deadline: '12345654',
      paymentToken: 'EGLD',
    });

    const expectedResult = {
      chainID: 'T',
      data: 'RVNEVE5GVFRyYW5zZmVyQDQ3NDU0ZTJkMzgzOTM4MzQ2NTM3QDA3QDAxQDAwMDAwMDAwMDAwMDAwMDAwNTAwZTJmNWZlZWM0NTZjZWE3NzkxNzIzZTM3ODczMDhkYzcyM2Y5NTI5OTBmZDZANjE3NTYzNzQ2OTZmNmU1NDZmNmI2NTZlQDNiOWFjYTAwQGE5OGFjN0BiYzYxMzZANDU0NzRjNDRAMjM4NmYyNmZjMTAwMDA=',
      gasLimit: 18000000,
      gasPrice: 1000000000,
      nonce: 0,
      options: undefined,
      receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      signature: undefined,
      value: '0',
      version: 2,
    };

    it('returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const result = await service.createAuction(ownerAddress, createAuctionRequestWithEgld);
      expect(result).toMatchObject(expectedResult);
    });

    it('when no whitelisted marketplace throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      const result = service.createAuction(ownerAddress, createAuctionRequestWithEgld);

      await expect(result).rejects.toThrowError(new BadRequestError('No marketplace available for this collection'));
    });

    it('when invalid payment token throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplaceWithESDTPaymentTokens);
      const result = service.createAuction(ownerAddress, createAuctionRequestWithEgld);

      await expect(result).rejects.toThrowError(new BadRequestError('Unaccepted payment token'));
    });

    it('with accepted payment identifier returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);

      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVFRyYW5zZmVyQDQ3NDU0ZTJkMzgzOTM4MzQ2NTM3QDA3QDAxQDAwMDAwMDAwMDAwMDAwMDAwNTAwZTJmNWZlZWM0NTZjZWE3NzkxNzIzZTM3ODczMDhkYzcyM2Y5NTI5OTBmZDZANjE3NTYzNzQ2OTZmNmU1NDZmNmI2NTZlQDNiOWFjYTAwQGE5OGFjN0BiYzYxMzZANDU1MzQ0NTRAMjM4NmYyNmZjMTAwMDA=',
        gasLimit: 18000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };
      const result = await service.createAuction(ownerAddress, {
        ...createAuctionRequestWithEgld,
        paymentToken: 'ESDT',
      });

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('bid', () => {
    const inputWithEgld = new BidRequest({
      auctionId: 1,
      paymentTokenIdentifier: 'EGLD',
      identifier: 'GEN-8984e7-07',
      price: '111111111111111',
    });

    const inputWithEsdt = new BidRequest({
      auctionId: 1,
      paymentTokenIdentifier: 'ESDT',
      identifier: 'GEN-8984e7-07',
      price: '111111111111111',
    });

    it('when invalid payment token throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEsdtPaymentToken);
      const result = service.bid(ownerAddress, inputWithEgld);

      await expect(result).rejects.toThrowError(new BadRequestError('Unaccepted payment token'));
    });

    it('bid with egld payment token returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);
      const expectedResult = {
        chainID: 'T',
        data: 'YmlkQDAxQDQ3NDU0ZTJkMzgzOTM4MzQ2NTM3QDA3',
        gasLimit: 11100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '111111111111111',
        version: 2,
      };

      const result = await service.bid(ownerAddress, inputWithEgld);

      expect(result).toMatchObject(expectedResult);
    });

    it('bid with ESDT payment token returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEsdtPaymentToken);
      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVFRyYW5zZmVyQDQ1NTM0NDU0QDY1MGUxMjRlZjFjN0A2MjY5NjRAMDFANDc0NTRlMmQzODM5MzgzNDY1MzdAMDc=',
        gasLimit: 11100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.bid(ownerAddress, inputWithEsdt);

      expect(result).toMatchObject(expectedResult);
    });

    it('when not expected payment token returns error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEsdtPaymentToken);

      const result = service.bid(ownerAddress, inputWithEgld);
      await expect(result).rejects.toThrowError(BadRequestError);
    });
  });

  describe('withdraw', () => {
    it('returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);
      const expectedResult = {
        chainID: 'T',
        data: 'd2l0aGRyYXdAMDE=',
        gasLimit: 10100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.withdraw('erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha', 1);

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('createOffer', () => {
    const createOfferRequest = new CreateOfferRequest({
      auctionId: 1,
      paymentToken: 'EGLD',
      quantity: '1',
      identifier: 'GEN-8984e7-07',
      paymentAmount: '111111111111111',
      deadline: '1111111111111',
    });
    it('when no whitelisted marketplace throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);

      const result = service.createOffer(ownerAddress, createOfferRequest);

      await expect(result).rejects.toThrowError(new BadRequestError('No marketplace available for this collection'));
    });

    it('when invalid payment token throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplaceWithESDTPaymentTokens);
      const result = service.createOffer(ownerAddress, createOfferRequest);

      await expect(result).rejects.toThrowError(new BadRequestError('Unaccepted payment token'));
    });

    it('with EGLD payment token returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);

      const expectedResult = {
        chainID: 'T',
        data: 'c2VuZE9mZmVyQDQ3NDU0ZTJkMzgzOTM4MzQ2NTM3QDA3QDAxQDAxMDJiMzYyMTFjN0AwMQ==',
        gasLimit: 11100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '111111111111111',
        version: 2,
      };

      const result = await service.createOffer(ownerAddress, createOfferRequest);

      expect(result).toMatchObject(expectedResult);
    });

    it('with ESDT payment token returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);

      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVFRyYW5zZmVyQDQ1NTM0NDU0QDY1MGUxMjRlZjFjN0A3MzY1NmU2NDRmNjY2NjY1NzJANDc0NTRlMmQzODM5MzgzNDY1MzdAMDdAMDFAMDEwMmIzNjIxMWM3QDAx',
        gasLimit: 11100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.createOffer(
        ownerAddress,
        new CreateOfferRequest({
          auctionId: 1,
          paymentToken: 'ESDT',
          quantity: '1',
          identifier: 'GEN-8984e7-07',
          paymentAmount: '111111111111111',
          deadline: '1111111111111',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('withdrawOffer', () => {
    it('when no whitelisted marketplace throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(new OfferEntity({ collection: 'GEN-8984e7', marketplaceOfferId: 1 }));

      const result = service.withdrawOffer('erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha', 1);

      await expect(result).rejects.toThrowError(new BadRequestError('No marketplace available for this collection'));
    });

    it('returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);

      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(new OfferEntity({ collection: 'GEN-8984e7', marketplaceOfferId: 1 }));

      const expectedResult = {
        chainID: 'T',
        data: 'd2l0aGRyYXdPZmZlckAwMQ==',
        gasLimit: 10100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.withdrawOffer('erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha', 1);

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('acceptOffer', () => {
    const offerResponse = new OfferEntity({
      collection: 'GEN-8984e7',
      marketplaceOfferId: 1,
      priceAmount: '10000',
      boughtTokensNo: '2',
    });
    const acceptOfferWithoutAuction = new AcceptOfferRequest({ offerId: 2 });

    it('without active auction and no whitelisted marketplace throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifierAndAddress = jest.fn().mockReturnValueOnce({
        type: NftTypeEnum.SemiFungibleESDT,
        balance: 10,
        identifier: 'GEN-8984e7-01',
      });
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(offerResponse);

      const result = service.acceptOffer(ownerAddress, acceptOfferWithoutAuction);

      await expect(result).rejects.toThrowError(new BadRequestError('No marketplace available for this collection'));
    });

    it('without active auction and user not owner of nft throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifierAndAddress = jest.fn().mockReturnValueOnce(null);
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(offerResponse);

      const result = service.acceptOffer(ownerAddress, acceptOfferWithoutAuction);

      await expect(result).rejects.toThrowError(new BadRequestError('You do not own this nft!'));
    });

    it('without active auction and not enouth balance throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifierAndAddress = jest
        .fn()
        .mockReturnValueOnce({ type: NftTypeEnum.SemiFungibleESDT, balance: 1, identifier: 'GEN-8984e7-01' });
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(offerResponse);

      const result = service.acceptOffer(ownerAddress, acceptOfferWithoutAuction);
      await expect(result).rejects.toThrowError(new BadRequestError('Not enough balance to accept this offer!'));
    });

    it('without active auction returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);

      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifierAndAddress = jest.fn().mockReturnValueOnce({
        type: NftTypeEnum.SemiFungibleESDT,
        balance: 10,
        identifier: 'GEN-8984e7-01',
      });
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(new OfferEntity(offerResponse));

      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVFRyYW5zZmVyQDQ3NDU0ZTJkMzgzOTM4MzQ2NTM3QDAxQDAyQDAwMDAwMDAwMDAwMDAwMDAwNTAwZTJmNWZlZWM0NTZjZWE3NzkxNzIzZTM3ODczMDhkYzcyM2Y5NTI5OTBmZDZANjE2MzYzNjU3MDc0NGY2NjY2NjU3MkAwMQ==',
        gasLimit: 10100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.acceptOffer(ownerAddress, acceptOfferWithoutAuction);

      expect(result).toMatchObject(expectedResult);
    });

    const acceptOfferWithAuctionId = new AcceptOfferRequest({ offerId: 2, auctionId: 1 });
    it('with active auction and no whitelisted marketplace throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(offerResponse);

      const result = service.acceptOffer(ownerAddress, acceptOfferWithAuctionId);

      await expect(result).rejects.toThrowError(new BadRequestError('No marketplace available for this collection'));
    });

    it('with active auction but no offer found throws expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(null);

      const result = service.acceptOffer(
        'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        new AcceptOfferRequest({ offerId: 2, auctionId: 1 }),
      );

      await expect(result).rejects.toThrowError(new BadRequestError('No offer/auction available'));
    });

    it('with auction id param but no auction found throws expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(null);
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(offerResponse);

      const result = service.acceptOffer(ownerAddress, acceptOfferWithAuctionId);

      await expect(result).rejects.toThrowError(new BadRequestError('No offer/auction available'));
    });

    it('with active auction but not owner throws expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(offerResponse);

      const result = service.acceptOffer('erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndghb', acceptOfferWithAuctionId);
      await expect(result).rejects.toThrowError(new BadRequestError('No offer/auction available'));
    });

    it('with active auction returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(marketplace);
      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);
      const offersService = module.get<OffersService>(OffersService);
      jest.spyOn(offersService, 'getOfferById').mockResolvedValueOnce(offerResponse);

      const expectedResult = {
        chainID: 'T',
        data: 'd2l0aGRyYXdBdWN0aW9uQW5kQWNjZXB0T2ZmZXJAMDFAMDE=',
        gasLimit: 10100000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.acceptOffer(ownerAddress, acceptOfferWithAuctionId);

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('endAuction', () => {
    it('returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);

      const expectedResult = {
        chainID: 'T',
        data: 'ZW5kQXVjdGlvbkAwMQ==',
        gasLimit: 12000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.endAuction('erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha', 1);

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('buySft', () => {
    const buySftRequestWithEgld = new BuySftRequest({
      auctionId: 1,
      paymentTokenIdentifier: 'EGLD',
      price: '1111111',
      quantity: '1',
      identifier: 'GEN-8984e7-01',
    });
    it('when invalid payment token throw expected error', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEsdtPaymentToken);

      const result = service.buySft(ownerAddress, buySftRequestWithEgld);

      await expect(result).rejects.toThrowError(new BadRequestError('Unaccepted payment token'));
    });

    it('with EGLD payment token returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEGLDPaymentToken);

      const expectedResult = {
        chainID: 'T',
        data: 'YnV5U2Z0QDAxQDQ3NDU0ZTJkMzgzOTM4MzQ2NTM3QDAxQDAx',
        gasLimit: 13000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '1111111',
        version: 2,
      };

      const result = await service.buySft(ownerAddress, buySftRequestWithEgld);

      expect(result).toMatchObject(expectedResult);
    });

    it('with ESDT payment token returns built transaction with right arguments', async () => {
      const marketplaceService = module.get<MarketplacesService>(MarketplacesService);
      marketplaceService.getMarketplaceAddressByKey = jest.fn().mockReturnValueOnce(marketplace.address);

      const auctionsService = module.get<AuctionsGetterService>(AuctionsGetterService);
      auctionsService.getAuctionById = jest.fn().mockReturnValueOnce(auctionWithEsdtPaymentToken);

      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVFRyYW5zZmVyQDQ1NTM0NDU0QDEwZjQ0N0A2Mjc1Nzk1MzY2NzRAMDFANDc0NTRlMmQzODM5MzgzNDY1MzdAMDFAMDE=',
        gasLimit: 13000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.buySft(ownerAddress, {
        ...buySftRequestWithEgld,
        paymentTokenIdentifier: 'ESDT',
      });

      expect(result).toMatchObject(expectedResult);
    });
  });
});
