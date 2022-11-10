import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { elrondConfig } from 'src/config';
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
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DEADRARE_KEY, XOXNO_KEY } from 'src/utils/constants';
import {
  BidEvent,
  BuySftEvent,
  WithdrawEvent,
  EndAuctionEvent,
  AuctionTokenEvent,
} from '../entities/auction';
import { AcceptGlobalOfferEvent } from '../entities/auction/acceptGlobalOffer.event';
import { AcceptOfferEvent } from '../entities/auction/acceptOffer.event';
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
    private usdPriceService: UsdPriceService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  public async handleExternalAuctionEvents(
    externalAuctionEvents: any[],
    hash: string,
  ) {
    for (let event of externalAuctionEvents) {
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
            const activeOrder =
              await this.ordersService.getActiveOrderForAuction(auction.id);

            if (activeOrder && activeOrder.priceAmount === topics.currentBid) {
              break;
            }
            const order = await this.ordersService.updateAuctionOrders(
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
              activeOrder,
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
        case ExternalAuctionEventEnum.BulkBuy:
          if (
            Buffer.from(event.topics[0], 'base64').toString() ===
            ExternalAuctionEventEnum.UpdateOffer
          ) {
            this.logger.log(
              `Update Offer event detected for hash '${hash}' at buy external marketplace, ignore it for the moment`,
            );
            return;
          }
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
          if (
            Buffer.from(event.topics[0], 'base64').toString() ===
            ExternalAuctionEventEnum.UpdateOffer
          ) {
            this.logger.log(
              `Update Offer event detected for hash '${hash}' at withdraw external marketplace ${event.address}, ignore it for the moment`,
            );
            return;
          }
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
            const paymentToken = await this.usdPriceService.getToken(
              changePriceAuction.paymentToken,
            );
            this.updateAuctionPrice(
              changePriceAuction,
              topicsChangePrice.newBid,
              hash,
              paymentToken?.decimals,
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
            `Update price event detected for hash '${hash}' and marketplace '${updatePriceMarketplace?.name}'`,
          );
          let updatePriceAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsUpdatePrice.auctionId, 16),
              updatePriceMarketplace.key,
            );
          let newPrice: string = await this.getNewPrice(
            updatePriceMarketplace,
            topicsUpdatePrice,
          );
          if (updatePriceAuction && newPrice) {
            const paymentToken = await this.usdPriceService.getToken(
              updatePriceAuction.paymentToken,
            );
            this.updateAuctionPrice(
              updatePriceAuction,
              newPrice,
              hash,
              paymentToken?.decimals,
            );

            this.auctionsService.updateAuction(
              updatePriceAuction,
              ExternalAuctionEventEnum.UpdatePrice,
            );
          }
          break;

        case ExternalAuctionEventEnum.AcceptOffer:
          const acceptOfferEvent = new AcceptOfferEvent(event);
          const topicsAcceptOffer = acceptOfferEvent.getTopics();
          const acceptOfferMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              acceptOfferEvent.getAddress(),
            );
          this.logger.log(
            `Accept Offer event detected for hash '${hash}' and marketplace '${acceptOfferMarketplace?.name}'`,
          );
          if (
            acceptOfferMarketplace.key === XOXNO_KEY &&
            topicsAcceptOffer.auctionId > 0
          ) {
            let updatePriceAuction =
              await this.auctionsGetterService.getAuctionByIdAndMarketplace(
                topicsAcceptOffer.auctionId,
                acceptOfferMarketplace.key,
              );

            if (updatePriceAuction) {
              updatePriceAuction.status = AuctionStatusEnum.Closed;
              updatePriceAuction.modifiedDate = new Date(
                new Date().toUTCString(),
              );
              this.auctionsService.updateAuction(
                updatePriceAuction,
                ExternalAuctionEventEnum.AcceptOffer,
              );
            }
          }

          break;
        case ExternalAuctionEventEnum.AcceptGlobalOffer:
          const acceptGlobalOfferEvent = new AcceptGlobalOfferEvent(event);
          const topicsAcceptGlobalOffer = acceptGlobalOfferEvent.getTopics();
          const acceptGlobalOfferMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              acceptGlobalOfferEvent.getAddress(),
            );
          this.logger.log(
            `Accept Global Offer event detected for hash '${hash}' and marketplace '${acceptGlobalOfferMarketplace?.name}'`,
          );
          if (
            acceptGlobalOfferMarketplace.key === XOXNO_KEY &&
            topicsAcceptGlobalOffer.auctionId > 0
          ) {
            let auction =
              await this.auctionsGetterService.getAuctionByIdAndMarketplace(
                topicsAcceptGlobalOffer.auctionId,
                acceptGlobalOfferMarketplace.key,
              );

            if (auction) {
              auction.status = AuctionStatusEnum.Closed;
              auction.modifiedDate = new Date(new Date().toUTCString());
              this.auctionsService.updateAuction(
                auction,
                ExternalAuctionEventEnum.AcceptGlobalOffer,
              );
            }
          }

          break;
      }
    }
  }

  private async getNewPrice(
    updatePriceMarketplace: Marketplace,
    topicsUpdatePrice: {
      collection: string;
      nonce: string;
      auctionId: string;
      newBid: string;
    },
  ) {
    if (updatePriceMarketplace.key === DEADRARE_KEY) {
      const auction = await this.nftAbiService.getAuctionQuery(
        parseInt(topicsUpdatePrice.auctionId, 16),
        updatePriceMarketplace,
      );
      if (auction) {
        return auction.min_bid.valueOf().toString();
      }
    }

    return topicsUpdatePrice.newBid;
  }

  private updateAuctionPrice(
    changePriceAuction: AuctionEntity,
    newBid: string,
    hash: string,
    decimals: number = elrondConfig.decimals,
  ) {
    changePriceAuction.minBid = newBid;
    changePriceAuction.minBidDenominated = BigNumberUtils.denominateAmount(
      newBid,
      decimals,
    );
    changePriceAuction.maxBid = newBid;
    changePriceAuction.maxBidDenominated = BigNumberUtils.denominateAmount(
      newBid,
      decimals,
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
