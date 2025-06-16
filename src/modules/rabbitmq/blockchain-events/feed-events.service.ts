import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CollectionApi } from 'src/common';
import { EventEnum, Feed } from 'src/common/services/mx-communication/models/feed.dto';
import { MxFeedService } from 'src/common/services/mx-communication/mx-feed.service';
import { AuctionEntity } from 'src/db/auctions';
import { OfferEntity } from 'src/db/offers';
import { OrderEntity } from 'src/db/orders';
import { AssetByIdentifierService } from 'src/modules/assets';
import { Marketplace } from 'src/modules/marketplaces/models';
import { Order } from 'src/modules/orders/models';
import { Token } from 'src/modules/usdPrice/Token.model';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { MintEvent } from '../entities/auction/mint.event';

@Injectable()
export class FeedEventsSenderService {
  constructor(
    private accountFeedService: MxFeedService,
    @Inject(forwardRef(() => AssetByIdentifierService))
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly usdPriceService: UsdPriceService,
  ) {}

  public async sendStartAuctionEvent(
    topicsAuctionToken: {
      originalOwner: string;
      collection: string;
      nonce: string;
      auctionId: string;
      nrAuctionTokens: string;
    },
    startAuction: AuctionEntity,
    auctionTokenMarketplace: Marketplace,
  ) {
    const nftData = await this.assetByIdentifierService.getAsset(startAuction.identifier);

    let minBidUsdAmount: String;
    let maxBidUsdAmount: String;
    let tokenData: Token;
    if (startAuction.paymentToken && startAuction.minBid && startAuction.maxBid) {
      [tokenData, minBidUsdAmount, maxBidUsdAmount] = await Promise.all([
        this.usdPriceService.getToken(startAuction.paymentToken),
        this.usdPriceService.getUsdAmountDenom(startAuction.paymentToken, startAuction.minBid),
        this.usdPriceService.getUsdAmountDenom(startAuction.paymentToken, startAuction.maxBid),
      ]);
    }

    await this.accountFeedService.addFeed(
      new Feed({
        actor: topicsAuctionToken.originalOwner,
        event: EventEnum.startAuction,
        reference: startAuction.identifier,
        extraInfo: {
          auctionId: startAuction.id,
          nftName: nftData?.name,
          verified: nftData?.verified ? true : false,
          minBid: startAuction.minBid,
          maxBid: startAuction.maxBid,
          minBidData: {
            amount: startAuction.minBid,
            usdAmount: minBidUsdAmount ?? undefined,
            tokenData: tokenData ?? undefined,
          },
          maxBidData: {
            amount: startAuction.maxBid,
            usdAmount: maxBidUsdAmount ?? undefined,
            tokenData: tokenData ?? undefined,
          },
          marketplaceKey: auctionTokenMarketplace.key,
          isNsfw: nftData?.isNsfw,
          scamInfo: nftData?.scamInfo,
        },
      }),
    );
  }

  public async sendWonAuctionEvent(
    topicsEndAuction: {
      currentWinner: string;
      collection: string;
      nonce: string;
      auctionId: string;
      nrAuctionTokens: string;
      currentBid: string;
    },
    endAuction: AuctionEntity,
    endMarketplace: Marketplace,
  ) {
    const endAuctionNftData = await this.assetByIdentifierService.getAsset(endAuction.identifier);

    let usdAmount: String;
    let tokenData: Token;
    if (endAuction.paymentToken && topicsEndAuction.currentBid) {
      [tokenData, usdAmount] = await Promise.all([
        this.usdPriceService.getToken(endAuction.paymentToken),
        this.usdPriceService.getUsdAmountDenom(endAuction.paymentToken, topicsEndAuction.currentBid),
      ]);
    }

    await this.accountFeedService.addFeed(
      new Feed({
        actor: topicsEndAuction.currentWinner,
        event: EventEnum.won,
        reference: endAuction.identifier,
        extraInfo: {
          auctionId: endAuction.id,
          nftName: endAuctionNftData?.name,
          verified: endAuctionNftData?.verified ? true : false,
          price: topicsEndAuction.currentBid,
          usdAmount: usdAmount ?? undefined,
          tokenData: tokenData ?? undefined,
          marketplaceKey: endMarketplace.key,
          isNsfw: endAuctionNftData?.isNsfw,
          scamInfo: endAuctionNftData?.scamInfo,
        },
      }),
    );
  }

  public async sendBuyEvent(
    currentWinner: string,
    bid: string,
    boughtTokens: string,
    orderSft: Order,
    buyAuction: AuctionEntity,
    buyMarketplace: Marketplace,
  ) {
    const buySftNftData = await this.assetByIdentifierService.getAsset(buyAuction.identifier);

    let usdAmount: String;
    let tokenData: Token;
    if (buyAuction.paymentToken && bid) {
      [tokenData, usdAmount] = await Promise.all([
        this.usdPriceService.getToken(buyAuction.paymentToken),
        this.usdPriceService.getUsdAmountDenom(buyAuction.paymentToken, bid),
      ]);
    }

    await this.accountFeedService.addFeed(
      new Feed({
        actor: currentWinner,
        event: EventEnum.buy,
        reference: buyAuction.identifier,
        extraInfo: {
          orderId: orderSft.id,
          nftName: buySftNftData?.name,
          verified: buySftNftData?.verified ? true : false,
          price: bid,
          usdAmount: usdAmount ?? undefined,
          tokenData: tokenData ?? undefined,
          auctionId: buyAuction.id,
          boughtTokens: boughtTokens,
          marketplaceKey: buyMarketplace.key,
          isNsfw: buySftNftData?.isNsfw,
          scamInfo: buySftNftData?.scamInfo,
        },
      }),
    );
  }

  public async sendMintEvent(
    identifier: string,
    mintEvent: MintEvent,
    createTopics: { collection: string; nonce: string },
    collection: CollectionApi,
  ) {
    const nftData = await this.assetByIdentifierService.getAsset(identifier);
    await this.accountFeedService.addFeed(
      new Feed({
        actor: mintEvent.getAddress(),
        event: EventEnum.mintNft,
        reference: createTopics.collection,
        extraInfo: {
          identifier: identifier,
          nftName: nftData?.name,
          verified: nftData?.verified ? true : false,
          collectionName: collection?.name,
          isNsfw: nftData?.isNsfw,
          scamInfo: nftData?.scamInfo,
        },
      }),
    );
  }

  public async sendBidEvent(
    auction: AuctionEntity,
    topics: {
      currentWinner: string;
      collection: string;
      nonce: string;
      auctionId: string;
      nrAuctionTokens: string;
      currentBid: string;
    },
    order: OrderEntity,
  ) {
    const bidNftData = await this.assetByIdentifierService.getAsset(auction.identifier);

    let usdAmount: String;
    let tokenData: Token;
    if (auction.paymentToken && topics.currentBid) {
      [tokenData, usdAmount] = await Promise.all([
        this.usdPriceService.getToken(auction.paymentToken),
        this.usdPriceService.getUsdAmountDenom(auction.paymentToken, topics.currentBid),
      ]);
    }

    await this.accountFeedService.addFeed(
      new Feed({
        actor: topics.currentWinner,
        event: EventEnum.bid,
        reference: auction?.identifier,
        extraInfo: {
          orderId: order.id,
          nftName: bidNftData?.name,
          verified: bidNftData?.verified ? true : false,
          price: topics.currentBid,
          usdAmount: usdAmount ?? undefined,
          tokenData: tokenData ?? undefined,
          auctionId: auction.id,
          marketplaceKey: auction.marketplaceKey,
          isNsfw: bidNftData?.isNsfw,
          scamInfo: bidNftData?.scamInfo,
        },
      }),
    );
  }

  public async sendOfferEvent(offer: OfferEntity) {
    const nft = await this.assetByIdentifierService.getAsset(offer.identifier);
    const [tokenData, usdAmount] = await Promise.all([
      this.usdPriceService.getToken(offer.priceToken),
      this.usdPriceService.getUsdAmountDenom(offer.priceToken, offer.priceAmount),
    ]);

    await this.accountFeedService.addFeed(
      new Feed({
        actor: offer.ownerAddress,
        event: EventEnum.sendOffer,
        reference: offer?.identifier,
        extraInfo: {
          offerId: offer.id,
          nftName: nft?.name,
          verified: nft?.verified ? true : false,
          price: offer.priceAmount,
          usdAmount: usdAmount ?? undefined,
          tokenData: tokenData ?? undefined,
          marketplaceKey: offer.marketplaceKey,
          isNsfw: nft?.isNsfw,
          scamInfo: nft?.scamInfo,
        },
      }),
    );
  }

  public async sendAcceptOfferEvent(nftOwner: string, offer: OfferEntity) {
    const nft = await this.assetByIdentifierService.getAsset(offer.identifier);
    const [tokenData, usdAmount] = await Promise.all([
      this.usdPriceService.getToken(offer.priceToken),
      this.usdPriceService.getUsdAmountDenom(offer.priceToken, offer.priceAmount),
    ]);

    await this.accountFeedService.addFeed(
      new Feed({
        actor: nftOwner,
        event: EventEnum.acceptOffer,
        reference: offer?.identifier,
        extraInfo: {
          offerId: offer.id,
          nftName: nft?.name,
          verified: nft?.verified ? true : false,
          price: offer.priceAmount,
          usdAmount: usdAmount ?? undefined,
          tokenData: tokenData ?? undefined,
          marketplaceKey: offer.marketplaceKey,
          offerOwner: offer.ownerAddress,
          isNsfw: nft?.isNsfw,
          scamInfo: nft?.scamInfo,
        },
      }),
    );
  }
}
