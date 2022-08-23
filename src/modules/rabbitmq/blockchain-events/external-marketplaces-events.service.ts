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
import denominate from 'src/utils/formatters';
import {
  BidEvent,
  BuySftEvent,
  WithdrawEvent,
  EndAuctionEvent,
  AuctionTokenEvent,
} from '../entities/auction';
import { ChangePriceEvent } from '../entities/auction/changePrice.event';

@Injectable()
export class ExternalMarketplaceEventsService {
  constructor(
    private auctionsService: AuctionsSetterService,
    private auctionsGetterService: AuctionsGetterService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private accountFeedService: ElrondFeedService,
    private elrondApi: ElrondApiService,
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

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
            await this.marketplaceService.getMarketplaceByAddress(
              bidEvent.getAddress(),
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
              this.auctionsService.updateAuctionStatus(
                auction.id,
                AuctionStatusEnum.Ended,
                hash,
                AuctionStatusEnum.Ended,
              );
            }
          }
          break;
        case ExternalAuctionEventEnum.Buy:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();
          const identifier = `${buySftTopics.collection}-${buySftTopics.nonce}`;
          const buyMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              buySftEvent.getAddress(),
            );
          const buyAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(buySftTopics.auctionId, 16),
              buyMarketplace.key,
            );
          if (buyAuction) {
            const result = await this.auctionsGetterService.getAvailableTokens(
              buyAuction.id,
              buyMarketplace.key,
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
                  auctionId: buyAuction.id,
                  boughtTokens: buySftTopics.boughtTokens,
                  marketplaceKey: buyMarketplace.key,
                },
              }),
            );
          }
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
          if (withdrawAuction) {
            this.auctionsService.updateAuctionStatus(
              withdrawAuction.id,
              AuctionStatusEnum.Closed,
              hash,
              AuctionEventEnum.WithdrawEvent,
            );
          }
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
          if (endAuction) {
            const endAuctionIdentifier = `${topicsEndAuction.collection}-${topicsEndAuction.nonce}`;
            this.auctionsService.updateAuctionStatus(
              endAuction.id,
              AuctionStatusEnum.Ended,
              hash,
              AuctionEventEnum.EndAuctionEvent,
            );
            this.notificationsService.updateNotificationStatus([
              parseInt(topicsEndAuction.auctionId, 16),
            ]);
            this.ordersService.updateOrder(
              endAuction.id,
              OrderStatusEnum.Bought,
            );
            const endAuctionNftData =
              await this.assetByIdentifierService.getAsset(
                endAuctionIdentifier,
              );
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
          }
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
        case ExternalAuctionEventEnum.ChangePrice:
          const changePriceEvent = new ChangePriceEvent(event);
          const topicsChangePrice = changePriceEvent.getTopics();
          const changePriceMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              changePriceEvent.getAddress(),
            );
          let changePriceAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsChangePrice.auctionId, 16),
              changePriceMarketplace.key,
            );

          if (changePriceAuction) {
            this.updateAuctionPrice(
              changePriceAuction,
              topicsChangePrice.newBid,
              hash,
            );

            this.auctionsService.updateAuction(
              changePriceAuction,
              ExternalAuctionEventEnum.ChangePrice,
            );
          }
          break;
      }
    }
  }

  private updateAuctionPrice(
    changePriceAuction: AuctionEntity,
    newBid: string,

    hash: string,
  ) {
    changePriceAuction.minBid = newBid;
    changePriceAuction.minBidDenominated = parseFloat(
      denominate({
        input: newBid.valueOf()?.toString(),
        denomination: 18,
        decimals: 2,
        showLastNonZeroDecimal: true,
      }).replace(',', ''),
    );
    changePriceAuction.maxBid = newBid;
    changePriceAuction.maxBidDenominated = parseFloat(
      denominate({
        input: newBid.valueOf()?.toString(),
        denomination: 18,
        decimals: 2,
        showLastNonZeroDecimal: true,
      }).replace(',', ''),
    );
    changePriceAuction.blockHash = hash;
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
