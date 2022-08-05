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
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import {
  AuctionEventEnum,
  NftEventEnum,
} from '../assets/models/AuctionEvent.enum';
import { AuctionsGetterService, AuctionsSetterService } from '../auctions';
import { AuctionStatusEnum } from '../auctions/models';
import { NotificationStatusEnum } from '../notifications/models';
import { NotificationTypeEnum } from '../notifications/models/Notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderArgs, OrderStatusEnum } from '../orders/models';
import { OrdersService } from '../orders/order.service';
import { CacheEventsPublisherService } from './change-events/cache-invalidation-publisher/change-events-publisher.service';
import {
  BidChangeEvent,
  CacheEventTypeEnum,
  ChangedEvent,
} from './change-events/events/owner-changed.event';
import {
  AuctionTokenEvent,
  BidEvent,
  BuySftEvent,
  EndAuctionEvent,
  WithdrawEvent,
} from './entities/auction';
import { MintEvent } from './entities/auction/mint.event';
import { TransferEvent } from './entities/auction/transfer.event';

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
    private readonly rabbitPublisherService: CacheEventsPublisherService,
  ) {}

  public async handleNftAuctionEvents(auctionEvents: any[], hash: string) {
    for (let event of auctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          const bidEvent = new BidEvent(event);
          const topics = bidEvent.getTopics();
          const auction = await this.auctionsGetterService.getAuctionById(
            parseInt(topics.auctionId, 16),
          );
          const order = await this.ordersService.createOrder(
            new CreateOrderArgs({
              ownerAddress: topics.currentWinner,
              auctionId: parseInt(topics.auctionId, 16),
              priceToken: 'EGLD',
              priceAmount: topics.currentBid,
              priceNonce: 0,
              blockHash: hash,
              status: OrderStatusEnum.Active,
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
                auctionId: parseInt(topics.auctionId, 16),
              },
            }),
          );
          await this.rabbitPublisherService.publish(
            new BidChangeEvent({
              id: parseInt(topics.auctionId, 16).toString(),
              type: CacheEventTypeEnum.Bid,
              identifier: auction?.identifier,
              ownerAddress: topics.currentWinner,
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
          const result = await this.auctionsGetterService.getAvailableTokens(
            parseInt(buySftTopics.auctionId, 16),
          );
          const totalRemaining = result
            ? result[0]?.availableTokens - parseFloat(buySftTopics.boughtTokens)
            : 0;
          if (totalRemaining === 0) {
            this.auctionsService.updateAuction(
              parseInt(buySftTopics.auctionId, 16),
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
              },
            }),
          );
          break;
        case AuctionEventEnum.WithdrawEvent:
          const withdraw = new WithdrawEvent(event);
          const topicsWithdraw = withdraw.getTopics();
          this.auctionsService.updateAuction(
            parseInt(topicsWithdraw.auctionId, 16),
            AuctionStatusEnum.Closed,
            hash,
            AuctionEventEnum.WithdrawEvent,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          const endAuction = new EndAuctionEvent(event);
          const topicsEndAuction = endAuction.getTopics();
          const endAuctionIdentifier = `${topicsEndAuction.collection}-${topicsEndAuction.nonce}`;
          this.auctionsService.updateAuction(
            parseInt(topicsEndAuction.auctionId, 16),
            AuctionStatusEnum.Ended,
            hash,
            AuctionEventEnum.EndAuctionEvent,
          );
          this.notificationsService.updateNotificationStatus([
            parseInt(topicsEndAuction.auctionId, 16),
          ]);
          this.ordersService.updateOrder(
            parseInt(topicsEndAuction.auctionId, 16),
            OrderStatusEnum.Bought,
          );
          const endAuctionNftData =
            await this.assetByIdentifierService.getAsset(endAuctionIdentifier);
          await this.accountFeedService.addFeed(
            new Feed({
              actor: topicsEndAuction.currentWinner,
              event: EventEnum.won,
              reference: endAuctionIdentifier,
              extraInfo: {
                auctionId: parseInt(topicsEndAuction.auctionId, 16),
                nftName: endAuctionNftData?.name,
                verified: endAuctionNftData?.verified ? true : false,
                price: topicsEndAuction.currentBid,
              },
            }),
          );

          break;
        case AuctionEventEnum.AuctionTokenEvent:
          const auctionToken = new AuctionTokenEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
          const startAuction = await this.auctionsService.saveAuction(
            parseInt(topicsAuctionToken.auctionId, 16),
            startAuctionIdentifier,
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
                  auctionId: parseInt(topicsAuctionToken.auctionId, 16),
                  nftName: nftData?.name,
                  verified: nftData?.verified ? true : false,
                  minBid: startAuction.minBid,
                  maxBid: startAuction.maxBid,
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
          this.rabbitPublisherService.publish(
            new ChangedEvent({
              id: createTopics.collection,
              type: CacheEventTypeEnum.Mint,
            }),
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
          this.triggerCacheInvalidation(
            `${transferTopics.collection}-${transferTopics.nonce}`,
          );
          break;

        case NftEventEnum.MultiESDTNFTTransfer:
          const multiTransferEvent = new TransferEvent(event);
          const multiTransferTopics = multiTransferEvent.getTopics();
          this.triggerCacheInvalidation(
            `${multiTransferTopics.collection}-${multiTransferTopics.nonce}`,
          );

          break;
      }
    }
  }

  private triggerCacheInvalidation(identifier: string) {
    this.rabbitPublisherService.publish(
      new ChangedEvent({
        id: identifier,
        type: CacheEventTypeEnum.OwnerChanged,
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
      }),
      new NotificationEntity({
        auctionId: auction.id,
        identifier: auction.identifier,
        ownerAddress: order.ownerAddress,
        status: NotificationStatusEnum.Active,
        type: NotificationTypeEnum.Won,
        name: assetName,
      }),
    ]);
  }
}
