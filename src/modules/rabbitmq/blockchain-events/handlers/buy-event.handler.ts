import { Injectable, Logger } from '@nestjs/common';
import { ElrondNftsSwapAuctionEventEnum } from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { CreateOrderArgs, OrderStatusEnum } from 'src/modules/orders/models';
import { OrdersService } from 'src/modules/orders/order.service';
import { BuySftEvent } from '../../entities/auction';
import { ElrondSwapBuyEvent } from '../../entities/auction/elrondnftswap/elrondswap-buy.event';
import { FeedEventsSenderService } from '../feed-events.service';

@Injectable()
export class BuyEventHandler {
  private readonly logger = new Logger(BuyEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private ordersService: OrdersService,
    private feedEventsSenderService: FeedEventsSenderService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const { buySftEvent, buySftTopics } = this.getEventAndTopics(event, hash);

    const buyMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        buySftEvent.getAddress(),
        marketplaceType,
        buySftTopics.collection,
      );

    if (!buyMarketplace) return;
    this.logger.log(
      `Buy event detected for hash '${hash}' and marketplace '${buyMarketplace?.name}'`,
    );
    const auction =
      await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        parseInt(buySftTopics.auctionId, 16),
        buyMarketplace.key,
      );
    if (!auction) return;

    const result = await this.auctionsGetterService.getAvailableTokens(
      auction.id,
    );
    const totalRemaining = result
      ? result[0]?.availableTokens - parseFloat(buySftTopics.boughtTokens)
      : 0;
    if (totalRemaining === 0) {
      this.auctionsService.updateAuctionStatus(
        auction.id,
        AuctionStatusEnum.Ended,
        hash,
        AuctionStatusEnum.Ended,
      );
    }
    const orderSft = await this.ordersService.createOrderForSft(
      new CreateOrderArgs({
        ownerAddress: buySftTopics.currentWinner,
        auctionId: auction.id,
        priceToken: auction.paymentToken,
        priceAmount: buySftTopics.bid,
        priceNonce: auction.paymentNonce,
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
      auction,
      buyMarketplace,
    );
  }

  private getEventAndTopics(event: any, hash: string) {
    if (event.identifier === ElrondNftsSwapAuctionEventEnum.Purchase) {
      if (
        Buffer.from(event.topics[0], 'base64').toString() ===
        ElrondNftsSwapAuctionEventEnum.UpdateListing
      ) {
        this.logger.log(
          `Update Listing event detected for hash '${hash}' at Purchase external marketplace ${event.address}, ignore it for the moment`,
        );
        return;
      }
      const buySftEvent = new ElrondSwapBuyEvent(event);
      const buySftTopics = buySftEvent.getTopics();
      return { buySftEvent, buySftTopics };
    }
    const buySftEvent = new BuySftEvent(event);
    const buySftTopics = buySftEvent.getTopics();
    return { buySftEvent, buySftTopics };
  }
}
