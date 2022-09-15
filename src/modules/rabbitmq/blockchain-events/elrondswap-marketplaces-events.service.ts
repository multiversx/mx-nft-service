import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { AuctionEntity } from 'src/db/auctions';
import { NotificationEntity } from 'src/db/notifications';
import { OrderEntity } from 'src/db/orders';
import { AssetByIdentifierService } from 'src/modules/assets/asset-by-identifier.service';
import {
  AuctionEventEnum,
  ElrondNftsSwapAuctionEventEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
import {
  AuctionsSetterService,
  AuctionsGetterService,
  NftMarketplaceAbiService,
} from 'src/modules/auctions';
import {
  AuctionStatusEnum,
  ElrondSwapAuctionTypeEnum,
} from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { NotificationStatusEnum } from 'src/modules/notifications/models';
import { NotificationTypeEnum } from 'src/modules/notifications/models/Notification-type.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { CreateOrderArgs, OrderStatusEnum } from 'src/modules/orders/models';
import { OrdersService } from 'src/modules/orders/order.service';
import { DEADRARE_KEY, XOXNO_KEY } from 'src/utils/constants';
import denominate from 'src/utils/formatters';
import { AcceptOfferEvent } from '../entities/auction/acceptOffer.event';
import { ChangePriceEvent } from '../entities/auction/changePrice.event';
import { ElrondSwapAuctionEvent } from '../entities/auction/elrondnftswap/elrondswap-auction.event';
import { ElrondSwapBidEvent } from '../entities/auction/elrondnftswap/elrondswap-bid.event';
import { ElrondSwapUpdateEvent } from '../entities/auction/elrondnftswap/elrondswap-updateAuction.event';
import { ElrondSwapWithdrawEvent } from '../entities/auction/elrondnftswap/elrondswap-withdraw.event';
import { UpdatePriceEvent } from '../entities/auction/updatePrice.event';
import { FeedEventsSenderService } from './feed-events.service';

@Injectable()
export class ElrondSwapMarketplaceEventsService {
  private readonly logger = new Logger(ElrondSwapMarketplaceEventsService.name);

  constructor(
    private auctionsService: AuctionsSetterService,
    private auctionsGetterService: AuctionsGetterService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private feedEventsSenderService: FeedEventsSenderService,
    private nftAbiService: NftMarketplaceAbiService,
    private elrondApi: ElrondApiService,
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  public async handleElrondNftSwapsAuctionEvents(
    externalAuctionEvents: any[],
    hash: string,
  ) {
    for (let event of externalAuctionEvents) {
      switch (event.identifier) {
        case ElrondNftsSwapAuctionEventEnum.Bid:
          const bidEvent = new ElrondSwapBidEvent(event);
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
        case ElrondNftsSwapAuctionEventEnum.WithdrawSwap:
          const withdraw = new ElrondSwapWithdrawEvent(event);
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
        case ElrondNftsSwapAuctionEventEnum.NftSwap:
          const auctionToken = new ElrondSwapAuctionEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          if (
            parseInt(topicsAuctionToken.auctionType) ===
            ElrondSwapAuctionTypeEnum.Swap
          ) {
            return;
          }
          const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
          const auctionTokenMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              auctionToken.getAddress(),
            );
          this.logger.log(
            `Auction listing event detected for hash '${hash}' and marketplace '${auctionTokenMarketplace?.name}'`,
          );

          const asset = await this.assetByIdentifierService.getAsset(
            startAuctionIdentifier,
          );

          const startAuction = await this.auctionsService.saveAuctionEntity(
            AuctionEntity.fromWithdrawTopics(
              topicsAuctionToken,
              asset.tags.toString(),
              hash,
              auctionTokenMarketplace.key,
            ),
            asset.tags,
          );
          if (startAuction) {
            await this.feedEventsSenderService.sendStartAuctionEvent(
              topicsAuctionToken,
              startAuction,
              auctionTokenMarketplace,
            );
          }
          break;
        case ElrondNftsSwapAuctionEventEnum.NftSwapUpdate:
          const updateEvent = new ElrondSwapUpdateEvent(event);
          const topicsUpdate = updateEvent.getTopics();
          const changePriceMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              updateEvent.getAddress(),
            );
          this.logger.log(
            `Udpdate auction event detected for hash '${hash}' and marketplace '${changePriceMarketplace?.name}'`,
          );
          let changePriceAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsUpdate.auctionId, 16),
              changePriceMarketplace.key,
            );

          if (changePriceAuction) {
            this.updateAuctionPrice(changePriceAuction, topicsUpdate, hash);

            this.auctionsService.updateAuction(
              changePriceAuction,
              ExternalAuctionEventEnum.ChangePrice,
            );
          }
          break;
        case ElrondNftsSwapAuctionEventEnum.NftSwapUpdate:
          const updatePriceEvent = new ElrondSwapUpdateEvent(event);
          const topicsUpdatePrice = updatePriceEvent.getTopics();
          const updatePriceMarketplace: Marketplace =
            await this.marketplaceService.getMarketplaceByAddress(
              updatePriceEvent.getAddress(),
            );
          this.logger.log(
            `Update auction event detected for hash '${hash}' and marketplace '${updatePriceMarketplace?.name}'`,
          );
          let updatePriceAuction =
            await this.auctionsGetterService.getAuctionByIdAndMarketplace(
              parseInt(topicsUpdatePrice.auctionId, 16),
              updatePriceMarketplace.key,
            );

          if (updatePriceAuction) {
            this.updateAuctionPrice(
              updatePriceAuction,
              topicsUpdatePrice,
              hash,
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
            updatePriceAuction.status = AuctionStatusEnum.Closed;
            updatePriceAuction.modifiedDate = new Date(
              new Date().toUTCString(),
            );
            this.auctionsService.updateAuction(
              updatePriceAuction,
              ExternalAuctionEventEnum.AcceptOffer,
            );
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
      const [minBid] = await this.nftAbiService.getMinMaxAuction(
        parseInt(topicsUpdatePrice.auctionId, 16),
        updatePriceMarketplace,
      );
      return minBid.toFixed();
    }

    return topicsUpdatePrice.newBid;
  }

  private updateAuctionPrice(
    changePriceAuction: AuctionEntity,
    topics: {
      seller: string;
      collection: string;
      nonce: string;
      auctionId: string;
      nrAuctionTokens: number;
      price: string;
      deadline: number;
    },
    hash: string,
  ) {
    changePriceAuction.minBid = topics.price;
    changePriceAuction.minBidDenominated = parseFloat(
      denominate({
        input: topics.price,
        denomination: 18,
        decimals: 2,
        showLastNonZeroDecimal: true,
      }).replace(',', ''),
    );
    changePriceAuction.endDate = topics.deadline;
    changePriceAuction.nrAuctionedTokens = topics.nrAuctionTokens;
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
