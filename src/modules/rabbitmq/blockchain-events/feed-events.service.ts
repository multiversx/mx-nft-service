import { Injectable } from '@nestjs/common';
import { CollectionApi } from 'src/common';
import { ElrondFeedService } from 'src/common/services/elrond-communication/elrond-feed.service';
import {
  EventEnum,
  Feed,
} from 'src/common/services/elrond-communication/models/feed.dto';
import { AuctionEntity } from 'src/db/auctions';
import { OrderEntity } from 'src/db/orders';
import { AssetByIdentifierService } from 'src/modules/assets';
import { Marketplace } from 'src/modules/marketplaces/models';
import { Order } from 'src/modules/orders/models';
import { UsdPriceLoader } from 'src/modules/usdAmount/loaders/usd-price.loader';
import { MintEvent } from '../entities/auction/mint.event';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';

@Injectable()
export class FeedEventsSenderService {
  constructor(
    private accountFeedService: ElrondFeedService,
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly usdPriceLoader: UsdPriceLoader,
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
    const nftData = await this.assetByIdentifierService.getAsset(
      startAuction.identifier,
    );

    let minBidUsdAmount: String;
    let maxBidUsdAmount: String;
    let tokenData: Token;
    if (
      startAuction.paymentToken &&
      startAuction.minBid &&
      startAuction.maxBid
    ) {
      [tokenData, minBidUsdAmount, maxBidUsdAmount] = await Promise.all([
        this.usdPriceLoader.getToken(startAuction.paymentToken),
        this.usdPriceLoader.getUsdAmountDenom(
          startAuction.paymentToken,
          startAuction.minBid,
        ),
        this.usdPriceLoader.getUsdAmountDenom(
          startAuction.paymentToken,
          startAuction.maxBid,
        ),
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
    const endAuctionNftData = await this.assetByIdentifierService.getAsset(
      endAuction.identifier,
    );

    let usdAmount: String;
    let tokenData: Token;
    if (endAuction.paymentToken && topicsEndAuction.currentBid) {
      [tokenData, usdAmount] = await Promise.all([
        this.usdPriceLoader.getToken(endAuction.paymentToken),
        this.usdPriceLoader.getUsdAmountDenom(
          endAuction.paymentToken,
          topicsEndAuction.currentBid,
        ),
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
    const buySftNftData = await this.assetByIdentifierService.getAsset(
      buyAuction.identifier,
    );

    let usdAmount: String;
    let tokenData: Token;
    if (buyAuction.paymentToken && bid) {
      [tokenData, usdAmount] = await Promise.all([
        this.usdPriceLoader.getToken(buyAuction.paymentToken),
        this.usdPriceLoader.getUsdAmountDenom(buyAuction.paymentToken, bid),
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
    const bidNftData = await this.assetByIdentifierService.getAsset(
      auction.identifier,
    );

    let usdAmount: String;
    let tokenData: Token;
    if (auction.paymentToken && topics.currentBid) {
      [tokenData, usdAmount] = await Promise.all([
        this.usdPriceLoader.getToken(auction.paymentToken),
        this.usdPriceLoader.getUsdAmountDenom(
          auction.paymentToken,
          topics.currentBid,
        ),
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
        },
      }),
    );
  }
}
