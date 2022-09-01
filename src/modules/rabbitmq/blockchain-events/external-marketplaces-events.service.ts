import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationEntity } from 'src/db/notifications';
import { OrderEntity } from 'src/db/orders';
import {
  AuctionEventEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
import {
  AuctionsSetterService,
  AuctionsGetterService,
  NftMarketplaceAbiService,
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
import { UpdatePriceEvent } from '../entities/auction/updatePrice.event';
import { FeedEventsSenderService } from './feed-events.service';

@Injectable()
export class ExternalMarketplaceEventsService {
  private readonly logger = new Logger(ExternalMarketplaceEventsService.name);

  constructor(
    private auctionsService: AuctionsSetterService,
    private auctionsGetterService: AuctionsGetterService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private feedEventsSenderService: FeedEventsSenderService,
    private nftAbiService: NftMarketplaceAbiService,
    private elrondApi: ElrondApiService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  public async handleExternalAuctionEvents(
    externalAuctionEvents: any[],
    hash: string,
  ) {
    for (let event of externalAuctionEvents) {
      console.log(JSON.stringify(event));
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          const bidEvent = new BidEvent(event);
          const topics = bidEvent.getTopics();
          const bidMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              bidEvent.getAddress(),
            );
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
        case ExternalAuctionEventEnum.Buy:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();
          const buyMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              buySftEvent.getAddress(),
            );
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
              buyMarketplace.key,
            );
            const totalRemaining = result
              ? result[0]?.availableTokens -
                parseFloat(buySftTopics.boughtTokens)
              : 0;
            if (totalRemaining <= 0) {
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
              buySftTopics,
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
            await this.marketplaceService.getMarketplaceByAddress(
              withdraw.getAddress(),
            );
          this.logger.log(
            `Withdraw event detected for hash '${hash}' and marketplace '${withdrawMarketplace?.name}'`,
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
          this.logger.log(
            `End auction event detected for hash '${hash}' and marketplace '${endMarketplace?.name}'`,
          );
          const endAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsEndAuction.auctionId, 16),
              endMarketplace.key,
            );
          if (endAuction) {
            this.auctionsService.updateAuctionStatus(
              endAuction.id,
              AuctionStatusEnum.Ended,
              hash,
              AuctionEventEnum.EndAuctionEvent,
            );
            this.notificationsService.updateNotificationStatus([endAuction.id]);
            this.ordersService.updateOrder(
              endAuction.id,
              OrderStatusEnum.Bought,
            );
            await this.feedEventsSenderService.sendWonAuctionEvent(
              topicsEndAuction,
              endAuction,
              endMarketplace,
            );
          }
          break;
        case ExternalAuctionEventEnum.Listing:
        case AuctionEventEnum.AuctionTokenEvent:
          const auctionToken = new AuctionTokenEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
          const auctionTokenMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              auctionToken.getAddress(),
            );
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
        case ExternalAuctionEventEnum.ChangePrice:
          const changePriceEvent = new ChangePriceEvent(event);
          const topicsChangePrice = changePriceEvent.getTopics();
          const changePriceMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              changePriceEvent.getAddress(),
            );
          this.logger.log(
            `Change price event detected for hash '${hash}' and marketplace '${changePriceMarketplace?.name}'`,
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
        case ExternalAuctionEventEnum.UpdatePrice:
          const updatePriceEvent = new UpdatePriceEvent(event);
          const topicsUpdatePrice = updatePriceEvent.getTopics();
          const updatePriceMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              updatePriceEvent.getAddress(),
            );
          this.logger.log(
            `Change price event detected for hash '${hash}' and marketplace '${updatePriceMarketplace?.name}'`,
          );
          let updatePriceAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsChangePrice.auctionId, 16),
              updatePriceMarketplace.key,
            );
          const [minBid, maxBid] = await this.nftAbiService.getMinMaxAuction(
            parseInt(topicsUpdatePrice.auctionId, 16),
            updatePriceMarketplace,
          );
          if (updatePriceAuction && minBid) {
            this.updateAuctionPrice(updatePriceAuction, minBid.toFixed(), hash);

            this.auctionsService.updateAuction(
              updatePriceAuction,
              ExternalAuctionEventEnum.UpdatePrice,
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
