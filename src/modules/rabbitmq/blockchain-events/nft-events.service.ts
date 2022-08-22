import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { ElrondFeedService } from 'src/common/services/elrond-communication/elrond-feed.service';
import {
  EventEnum,
  Feed,
} from 'src/common/services/elrond-communication/models/feed.dto';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationEntity } from 'src/db/notifications';
import { OrderEntity } from 'src/db/orders';
import { AssetByIdentifierService } from 'src/modules/assets';
import {
  AuctionEventEnum,
  ExternalAuctionEventEnum,
  NftEventEnum,
} from 'src/modules/assets/models';
import {
  AuctionsSetterService,
  AuctionsGetterService,
} from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { NotificationStatusEnum } from 'src/modules/notifications/models';
import { NotificationTypeEnum } from 'src/modules/notifications/models/Notification-type.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { CreateOrderArgs, OrderStatusEnum } from 'src/modules/orders/models';
import { OrdersService } from 'src/modules/orders/order.service';
import { CacheEventsPublisherService } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../cache-invalidation/events/owner-changed.event';
import {
  BidEvent,
  BuySftEvent,
  WithdrawEvent,
  EndAuctionEvent,
  AuctionTokenEvent,
} from '../entities/auction';
import { MintEvent } from '../entities/auction/mint.event';
import { TransferEvent } from '../entities/auction/transfer.event';

@Injectable()
export class NftEventsService {
  constructor(
    private auctionsService: AuctionsSetterService,
    private auctionsGetterService: AuctionsGetterService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private accountFeedService: ElrondFeedService,
    private elrondApi: ElrondApiService,
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  public async handleNftAuctionEvents(auctionEvents: any[], hash: string) {
    for (let event of auctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          const bidEvent = new BidEvent(event);
          const topics = bidEvent.getTopics();
          const bidMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              topics.collection,
              bidEvent.getAddress(),
            );
          const auction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topics.auctionId, 16),
              bidMarketplace.key,
            );
          const order = await this.ordersService.createOrder(
            new CreateOrderArgs({
              ownerAddress: topics.currentWinner,
              auctionId: auction.id,
              priceToken: 'EGLD',
              priceAmount: topics.currentBid,
              priceNonce: 0,
              blockHash: hash,
              status: OrderStatusEnum.Active,
              marketplaceKey: bidMarketplace.key,
            }),
          );

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
          if (auction.maxBidDenominated === order.priceAmountDenominated) {
            this.notificationsService.updateNotificationStatus([auction?.id]);
            this.addNotifications(auction, order);
            this.auctionsService.updateAuction(
              auction.id,
              AuctionStatusEnum.Claimable,
              hash,
              AuctionStatusEnum.Claimable,
            );
          }
          break;
        case AuctionEventEnum.BuySftEvent:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();
          const identifier = `${buySftTopics.collection}-${buySftTopics.nonce}`;

          const buyMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              buySftTopics.collection,
              buySftEvent.getAddress(),
            );
          const buyAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(buySftTopics.auctionId, 16),
              buyMarketplace.key,
            );
          const result = await this.auctionsGetterService.getAvailableTokens(
            parseInt(buySftTopics.auctionId, 16),
            buyMarketplace.key,
          );
          const totalRemaining = result
            ? result[0]?.availableTokens - parseFloat(buySftTopics.boughtTokens)
            : 0;
          if (totalRemaining === 0) {
            this.auctionsService.updateAuction(
              buyAuction.id,
              AuctionStatusEnum.Ended,
              hash,
              AuctionStatusEnum.Ended,
            );
          }
          const orderSft = await this.ordersService.createOrderForSft(
            new CreateOrderArgs({
              ownerAddress: buySftTopics.currentWinner,
              auctionId: buyAuction.id,
              priceToken: 'EGLD',
              priceAmount: buySftTopics.bid,
              priceNonce: 0,
              blockHash: hash,
              status: OrderStatusEnum.Bought,
              boughtTokens: buySftTopics.boughtTokens,
              marketplaceKey: buyMarketplace.key,
            }),
          );
          const buySftNftData = await this.assetByIdentifierService.getAsset(
            identifier,
          );
          await this.accountFeedService.addFeed(
            new Feed({
              actor: buySftTopics.currentWinner,
              event: EventEnum.buy,
              reference: identifier,
              extraInfo: {
                orderId: orderSft.id,
                nftName: buySftNftData?.name,
                verified: buySftNftData?.verified ? true : false,
                price: buySftTopics.bid,
                auctionId: parseInt(buySftTopics.auctionId, 16),
                boughtTokens: buySftTopics.boughtTokens,
                marketplaceKey: buyMarketplace.key,
              },
            }),
          );
          break;
        case AuctionEventEnum.WithdrawEvent:
          const withdraw = new WithdrawEvent(event);
          const topicsWithdraw = withdraw.getTopics();
          const withdrawMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              topicsWithdraw.collection,
              withdraw.getAddress(),
            );
          const withdrawAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsWithdraw.auctionId, 16),
              withdrawMarketplace.key,
            );

          this.auctionsService.updateAuction(
            withdrawAuction.id,
            AuctionStatusEnum.Closed,
            hash,
            AuctionEventEnum.WithdrawEvent,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          const endAuctionEvent = new EndAuctionEvent(event);
          const topicsEndAuction = endAuctionEvent.getTopics();
          const endMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              topicsEndAuction.collection,
              endAuctionEvent.getAddress(),
            );
          const endAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsEndAuction.auctionId, 16),
              endMarketplace.key,
            );

          const endAuctionIdentifier = `${topicsEndAuction.collection}-${topicsEndAuction.nonce}`;
          this.auctionsService.updateAuction(
            endAuction.id,
            AuctionStatusEnum.Ended,
            hash,
            AuctionEventEnum.EndAuctionEvent,
          );
          this.notificationsService.updateNotificationStatus([
            parseInt(topicsEndAuction.auctionId, 16),
          ]);
          this.ordersService.updateOrder(endAuction.id, OrderStatusEnum.Bought);
          const endAuctionNftData =
            await this.assetByIdentifierService.getAsset(endAuctionIdentifier);
          await this.accountFeedService.addFeed(
            new Feed({
              actor: topicsEndAuction.currentWinner,
              event: EventEnum.won,
              reference: endAuctionIdentifier,
              extraInfo: {
                auctionId: endAuction.id,
                nftName: endAuctionNftData?.name,
                verified: endAuctionNftData?.verified ? true : false,
                price: topicsEndAuction.currentBid,
                marketplaceKey: endMarketplace.key,
              },
            }),
          );

          break;
        case AuctionEventEnum.AuctionTokenEvent:
          const auctionToken = new AuctionTokenEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
          const auctionTokenMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              topicsAuctionToken.collection,
              auctionToken.getAddress(),
            );
          const startAuction = await this.auctionsService.saveAuction(
            parseInt(topicsAuctionToken.auctionId, 16),
            startAuctionIdentifier,
            auctionTokenMarketplace.key,
            auctionTokenMarketplace.address,
            hash,
          );
          if (startAuction) {
            const nftData = await this.assetByIdentifierService.getAsset(
              startAuctionIdentifier,
            );
            await this.accountFeedService.addFeed(
              new Feed({
                actor: topicsAuctionToken.originalOwner,
                event: EventEnum.startAuction,
                reference: startAuctionIdentifier,
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
          break;
      }
    }
  }

  public async handleExternalAuctionEvents(
    externalAuctionEvents: any[],
    hash: string,
  ) {
    console.log({ externalAuctionEvents });
    for (let event of externalAuctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          const bidEvent = new BidEvent(event);
          const topics = bidEvent.getTopics();
          const bidMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              topics.collection,
              bidEvent.getAddress(),
            );
          const auction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topics.auctionId, 16),
              bidMarketplace.key,
            );
          const order = await this.ordersService.createOrder(
            new CreateOrderArgs({
              ownerAddress: topics.currentWinner,
              auctionId: auction.id,
              priceToken: 'EGLD',
              priceAmount: topics.currentBid,
              priceNonce: 0,
              blockHash: hash,
              status: OrderStatusEnum.Active,
              marketplaceKey: bidMarketplace.key,
            }),
          );

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
          if (auction.maxBidDenominated === order.priceAmountDenominated) {
            this.notificationsService.updateNotificationStatus([auction?.id]);
            this.addNotifications(auction, order);
            this.auctionsService.updateAuction(
              auction.id,
              AuctionStatusEnum.Claimable,
              hash,
              AuctionStatusEnum.Claimable,
            );
          }
          break;
        case ExternalAuctionEventEnum.Buy:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();
          const identifier = `${buySftTopics.collection}-${buySftTopics.nonce}`;
          const buyMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              buySftTopics.collection,
              buySftEvent.getAddress(),
            );
          const result = await this.auctionsGetterService.getAvailableTokens(
            parseInt(buySftTopics.auctionId, 16),
            buyMarketplace.key,
          );
          const totalRemaining = result
            ? result[0]?.availableTokens - parseFloat(buySftTopics.boughtTokens)
            : 0;
          if (totalRemaining === 0) {
            this.auctionsService.updateAuctionByMarketplaceKey(
              parseInt(buySftTopics.auctionId, 16),
              buyMarketplace.key,
              AuctionStatusEnum.Ended,
              hash,
              AuctionStatusEnum.Ended,
            );
          }
          const orderSft = await this.ordersService.createOrderForSft(
            new CreateOrderArgs({
              ownerAddress: buySftTopics.currentWinner,
              auctionId: parseInt(buySftTopics.auctionId, 16),
              priceToken: 'EGLD',
              priceAmount: buySftTopics.bid,
              priceNonce: 0,
              blockHash: hash,
              status: OrderStatusEnum.Bought,
              boughtTokens: buySftTopics.boughtTokens,
              marketplaceKey: buyMarketplace.key,
            }),
          );
          const buySftNftData = await this.assetByIdentifierService.getAsset(
            identifier,
          );
          await this.accountFeedService.addFeed(
            new Feed({
              actor: buySftTopics.currentWinner,
              event: EventEnum.buy,
              reference: identifier,
              extraInfo: {
                orderId: orderSft.id,
                nftName: buySftNftData?.name,
                verified: buySftNftData?.verified ? true : false,
                price: buySftTopics.bid,
                auctionId: parseInt(buySftTopics.auctionId, 16),
                boughtTokens: buySftTopics.boughtTokens,
                marketplaceKey: buyMarketplace.key,
              },
            }),
          );
          break;
        case AuctionEventEnum.WithdrawEvent:
          const withdraw = new WithdrawEvent(event);
          const topicsWithdraw = withdraw.getTopics();
          const withdrawMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              withdraw.getAddress(),
            );
          const withdrawAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsWithdraw.auctionId, 16),
              withdrawMarketplace.key,
            );

          this.auctionsService.updateAuction(
            withdrawAuction.id,
            AuctionStatusEnum.Closed,
            hash,
            AuctionEventEnum.WithdrawEvent,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          const endAuctionEvent = new EndAuctionEvent(event);
          const topicsEndAuction = endAuctionEvent.getTopics();
          const endMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              endAuctionEvent.getAddress(),
            );
          const endAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsEndAuction.auctionId, 16),
              endMarketplace.key,
            );

          const endAuctionIdentifier = `${topicsEndAuction.collection}-${topicsEndAuction.nonce}`;
          this.auctionsService.updateAuction(
            endAuction.id,
            AuctionStatusEnum.Ended,
            hash,
            AuctionEventEnum.EndAuctionEvent,
          );
          this.notificationsService.updateNotificationStatus([
            parseInt(topicsEndAuction.auctionId, 16),
          ]);
          this.ordersService.updateOrder(endAuction.id, OrderStatusEnum.Bought);
          const endAuctionNftData =
            await this.assetByIdentifierService.getAsset(endAuctionIdentifier);
          await this.accountFeedService.addFeed(
            new Feed({
              actor: topicsEndAuction.currentWinner,
              event: EventEnum.won,
              reference: endAuctionIdentifier,
              extraInfo: {
                auctionId: endAuction.id,
                nftName: endAuctionNftData?.name,
                verified: endAuctionNftData?.verified ? true : false,
                price: topicsEndAuction.currentBid,
                marketplaceKey: endMarketplace.key,
              },
            }),
          );

          break;
        case ExternalAuctionEventEnum.Listing:
          const auctionToken = new AuctionTokenEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
          const auctionTokenMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              auctionToken.getAddress(),
            );
          const startAuction = await this.auctionsService.saveAuction(
            parseInt(topicsAuctionToken.auctionId, 16),
            startAuctionIdentifier,
            auctionTokenMarketplace.key,
            auctionTokenMarketplace.address,
            hash,
          );
          if (startAuction) {
            const nftData = await this.assetByIdentifierService.getAsset(
              startAuctionIdentifier,
            );
            await this.accountFeedService.addFeed(
              new Feed({
                actor: topicsAuctionToken.originalOwner,
                event: EventEnum.startAuction,
                reference: startAuctionIdentifier,
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
          break;
      }
    }
  }

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          const identifier = `${createTopics.collection}-${createTopics.nonce}`;
          this.triggerCacheInvalidation(
            createTopics.collection,
            CacheEventTypeEnum.Mint,
          );
          const collection =
            await this.elrondApi.getCollectionByIdentifierForQuery(
              createTopics.collection,
              'fields=name',
            );
          const nftData = await this.assetByIdentifierService.getAsset(
            identifier,
          );
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

          break;

        case NftEventEnum.ESDTNFTTransfer:
          const transferEvent = new TransferEvent(event);
          const transferTopics = transferEvent.getTopics();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await this.triggerCacheInvalidation(
            `${transferTopics.collection}-${transferTopics.nonce}`,
            CacheEventTypeEnum.OwnerChanged,
          );
          break;

        case NftEventEnum.MultiESDTNFTTransfer:
          const multiTransferEvent = new TransferEvent(event);
          const multiTransferTopics = multiTransferEvent.getTopics();
          this.triggerCacheInvalidation(
            `${multiTransferTopics.collection}-${multiTransferTopics.nonce}`,
            CacheEventTypeEnum.OwnerChanged,
          );

          break;
      }
    }
  }

  private async triggerCacheInvalidation(
    id: string,
    eventType: CacheEventTypeEnum,
  ) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: id,
        type: eventType,
      }),
    );
  }

  private async addNotifications(auction: AuctionEntity, order: OrderEntity) {
    const asset = await this.elrondApi.getNftByIdentifier(auction.identifier);
    const assetName = asset ? asset.name : '';
    this.notificationsService.saveNotifications([
      new NotificationEntity({
        auctionId: auction.id,
        identifier: auction.identifier,
        ownerAddress: auction.ownerAddress,
        status: NotificationStatusEnum.Active,
        type: NotificationTypeEnum.Ended,
        name: assetName,
        marketplaceKey: auction.marketplaceKey,
      }),
      new NotificationEntity({
        auctionId: auction.id,
        identifier: auction.identifier,
        ownerAddress: order.ownerAddress,
        status: NotificationStatusEnum.Active,
        type: NotificationTypeEnum.Won,
        name: assetName,
        marketplaceKey: auction.marketplaceKey,
      }),
    ]);
  }
}
