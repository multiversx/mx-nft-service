import { ElrondApiService } from 'src/common';
import { Injectable, Logger } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationEntity } from 'src/db/notifications';
import { OrderEntity } from 'src/db/orders';
import {
  AuctionEventEnum,
  NftEventEnum,
  NftTypeEnum,
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
} from '../cache-invalidation/events/changed.event';
import {
  BidEvent,
  BuySftEvent,
  WithdrawEvent,
  EndAuctionEvent,
  AuctionTokenEvent,
} from '../entities/auction';
import { MintEvent } from '../entities/auction/mint.event';
import { TransferEvent } from '../entities/auction/transfer.event';
import { FeedEventsSenderService } from './feed-events.service';

@Injectable()
export class NftEventsService {
  private readonly logger = new Logger(NftEventsService.name);
  constructor(
    private auctionsService: AuctionsSetterService,
    private auctionsGetterService: AuctionsGetterService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private feedEventsSenderService: FeedEventsSenderService,
    private elrondApi: ElrondApiService,
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

          if (!bidMarketplace) return;
          this.logger.log(
            `Bid event detected for hash '${hash}' and marketplace '${bidMarketplace?.name}'`,
          );
          const auction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topics.auctionId, 16),
              bidMarketplace.key,
            );
          if (auction) {
            const order = await this.ordersService.createOrder(
              new CreateOrderArgs({
                ownerAddress: topics.currentWinner,
                auctionId: auction.id,
                priceToken: auction.paymentToken,
                priceAmount: topics.currentBid,
                priceNonce: auction.paymentNonce,
                blockHash: hash,
                status: OrderStatusEnum.Active,
                marketplaceKey: bidMarketplace.key,
              }),
            );
            await this.feedEventsSenderService.sendBidEvent(
              auction,
              topics,
              order,
            );
            if (auction.maxBidDenominated === order.priceAmountDenominated) {
              this.notificationsService.updateNotificationStatus([auction?.id]);
              this.addNotifications(auction, order);
              this.auctionsService.updateAuctionStatus(
                auction.id,
                AuctionStatusEnum.Ended,
                hash,
                AuctionStatusEnum.Ended,
              );
            }
          }
          break;
        case AuctionEventEnum.BuySftEvent:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();

          const buyMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              buySftTopics.collection,
              buySftEvent.getAddress(),
            );

          if (!buyMarketplace) return;
          this.logger.log(
            `Buy event detected for hash '${hash}' and marketplace '${buyMarketplace?.name}'`,
          );
          const buyAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(buySftTopics.auctionId, 16),
              buyMarketplace.key,
            );
          if (buyAuction) {
            const result = await this.auctionsGetterService.getAvailableTokens(
              buyAuction.id,
            );
            const totalRemaining = result
              ? result[0]?.availableTokens -
                parseFloat(buySftTopics.boughtTokens)
              : 0;
            if (totalRemaining === 0) {
              this.auctionsService.updateAuctionStatus(
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
                priceToken: buyAuction.paymentToken,
                priceAmount: buySftTopics.bid,
                priceNonce: buyAuction.paymentNonce,
                blockHash: hash,
                status: OrderStatusEnum.Bought,
                boughtTokens: buySftTopics.boughtTokens,
                marketplaceKey: buyMarketplace.key,
              }),
            );
            await this.feedEventsSenderService.sendBuyEvent(
              buySftTopics.currentWinner,
              buySftTopics.bid,
              buySftTopics.boughtTokens,
              orderSft,
              buyAuction,
              buyMarketplace,
            );
          }
          break;
        case AuctionEventEnum.WithdrawEvent:
          const withdraw = new WithdrawEvent(event);
          const topicsWithdraw = withdraw.getTopics();
          const withdrawMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByCollectionAndAddress(
              topicsWithdraw.collection,
              withdraw.getAddress(),
            );
          if (!withdrawMarketplace) return;

          this.logger.log(
            `Withdraw event detected for hash '${hash}' and marketplace '${withdrawMarketplace?.name}'`,
          );
          const withdrawAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsWithdraw.auctionId, 16),
              withdrawMarketplace.key,
            );

          this.auctionsService.updateAuctionStatus(
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

          if (!endMarketplace) return;
          this.logger.log(
            `End auction event detected for hash '${hash}' and marketplace '${endMarketplace?.name}'`,
          );
          const endAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsEndAuction.auctionId, 16),
              endMarketplace.key,
            );

          this.auctionsService.updateAuctionStatus(
            endAuction.id,
            AuctionStatusEnum.Ended,
            hash,
            AuctionEventEnum.EndAuctionEvent,
          );
          this.notificationsService.updateNotificationStatus([endAuction.id]);
          this.ordersService.updateOrder(endAuction.id, OrderStatusEnum.Bought);
          await this.feedEventsSenderService.sendWonAuctionEvent(
            topicsEndAuction,
            endAuction,
            endMarketplace,
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

          if (!auctionTokenMarketplace) return;
          this.logger.log(
            `Auction listing event detected for hash '${hash}' and marketplace '${auctionTokenMarketplace?.name}'`,
          );
          const startAuction = await this.auctionsService.saveAuction(
            parseInt(topicsAuctionToken.auctionId, 16),
            startAuctionIdentifier,
            auctionTokenMarketplace,
            hash,
          );
          if (startAuction) {
            await this.feedEventsSenderService.sendStartAuctionEvent(
              topicsAuctionToken,
              startAuction,
              auctionTokenMarketplace,
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
              'fields=name,type',
            );
          if (
            collection?.type === NftTypeEnum.NonFungibleESDT ||
            collection?.type === NftTypeEnum.SemiFungibleESDT
          ) {
            await this.feedEventsSenderService.sendMintEvent(
              identifier,
              mintEvent,
              createTopics,
              collection,
            );
          }
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
        type: NotificationTypeEnum.Sold,
        name: assetName,
        marketplaceKey: auction.marketplaceKey,
      }),
      new NotificationEntity({
        auctionId: auction.id,
        identifier: auction.identifier,
        ownerAddress: order.ownerAddress,
        status: NotificationStatusEnum.Active,
        type: NotificationTypeEnum.Bought,
        name: assetName,
        marketplaceKey: auction.marketplaceKey,
      }),
    ]);
  }
}
