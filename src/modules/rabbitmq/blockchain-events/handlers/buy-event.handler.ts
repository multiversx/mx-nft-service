import { Injectable, Logger } from '@nestjs/common';
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
    const buySftEvent = new BuySftEvent(event);
    const buySftTopics = buySftEvent.getTopics();

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
        ? result[0]?.availableTokens - parseFloat(buySftTopics.boughtTokens)
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
  }
}
