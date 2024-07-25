import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { CreateOrderArgs, OrderStatusEnum } from 'src/modules/orders/models';
import { OrdersService } from 'src/modules/orders/order.service';
import { BuySftEvent } from '../../entities/auction-reindex';
import { ClaimEvent } from '../../entities/auction-reindex/claim.event';
import { ElrondSwapBuyEvent } from '../../entities/auction-reindex/elrondnftswap/elrondswap-buy.event';
import { FeedEventsSenderService } from '../feed-events.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { EventLog } from 'src/modules/metrics/rabbitEvent';

@Injectable()
export class BuyEventHandler {
  private readonly logger = new Logger(BuyEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private ordersService: OrdersService,
    private feedEventsSenderService: FeedEventsSenderService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) { }

  async handle(event: any, marketplace: Marketplace) {
    try {
      const { buySftEvent, topics } = this.getEventAndTopics(event, 'hash');
      let auction: AuctionEntity;

      marketplace = await this.marketplaceService.getMarketplaceByType(buySftEvent.address, marketplace.type, topics.collection);

      if (!marketplace) return;
      this.logger.log(`${buySftEvent.identifier}  event detected for marketplace '${marketplace?.name}'`);

      if (topics.auctionId) {
        auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
      } else {
        const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
        auction = await this.auctionsGetterService.getAuctionByIdentifierAndMarketplace(auctionIdentifier, marketplace.key);
      }
      if (!auction) return;

      const result = await this.auctionsGetterService.getAvailableTokens(auction.id);
      const totalRemaining = result ? result[0]?.availableTokens - parseFloat(topics.boughtTokens) : 0;
      if (totalRemaining === 0) {
        this.auctionsService.updateAuctionStatus(auction.id, AuctionStatusEnum.Ended, 'hash', AuctionStatusEnum.Ended);
      }
      const orderSft = await this.ordersService.createOrderForSft(
        new CreateOrderArgs({
          ownerAddress: topics.currentWinner,
          auctionId: auction.id,
          priceToken: auction.paymentToken,
          priceAmount: auction.minBid,
          priceNonce: auction.paymentNonce,
          blockHash: 'hash',
          status: OrderStatusEnum.Bought,
          boughtTokens: topics.boughtTokens,
          marketplaceKey: marketplace.key,
        }),
      );
      await this.feedEventsSenderService.sendBuyEvent(
        topics.currentWinner,
        auction.minBid,
        topics.boughtTokens,
        orderSft,
        auction,
        marketplace,
      );
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }

  private getEventAndTopics(event: EventLog, hash: string) {
    if (event.identifier === KroganSwapAuctionEventEnum.Purchase) {
      if (Buffer.from(event.topics[0], 'base64').toString() === KroganSwapAuctionEventEnum.UpdateListing) {
        this.logger.log(
          `Update Listing event detected for hash '${hash}' at Purchase external marketplace ${event.address}, ignore it for the moment`,
        );
        return;
      }
      const buySftEvent = new ElrondSwapBuyEvent(event);
      const topics = buySftEvent.getTopics();
      return { buySftEvent, topics };
    }

    if (event.identifier === ExternalAuctionEventEnum.BuyNft) {
      const buySftEvent = new ClaimEvent(event);
      const topics = buySftEvent.getTopics();
      return { buySftEvent, topics };
    }
    const buySftEvent = new BuySftEvent(event);
    const topics = buySftEvent.getTopics();
    return { buySftEvent, topics };
  }
}
