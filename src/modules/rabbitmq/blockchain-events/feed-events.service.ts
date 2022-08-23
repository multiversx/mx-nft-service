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
import { MintEvent } from '../entities/auction/mint.event';

@Injectable()
export class FeedEventsSenderService {
  constructor(
    private accountFeedService: ElrondFeedService,
    private assetByIdentifierService: AssetByIdentifierService,
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
          marketplaceKey: endMarketplace.key,
        },
      }),
    );
  }

  public async sendBuyEvent(
    buySftTopics: {
      currentWinner: string;
      collection: string;
      nonce: string;
      auctionId: string;
      bid: string;
      boughtTokens: string;
    },
    orderSft: Order,
    buyAuction: AuctionEntity,
    buyMarketplace: Marketplace,
  ) {
    const buySftNftData = await this.assetByIdentifierService.getAsset(
      buyAuction.identifier,
    );
    await this.accountFeedService.addFeed(
      new Feed({
        actor: buySftTopics.currentWinner,
        event: EventEnum.buy,
        reference: buyAuction.identifier,
        extraInfo: {
          orderId: orderSft.id,
          nftName: buySftNftData?.name,
          verified: buySftNftData?.verified ? true : false,
          price: buySftTopics.bid,
          auctionId: buyAuction.id,
          boughtTokens: buySftTopics.boughtTokens,
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
          auctionId: auction.id,
        },
      }),
    );
  }
}
