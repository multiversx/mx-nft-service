import { Module, forwardRef } from '@nestjs/common';
import { DisabledMarketplaceEventsService } from './disable-marketplace-events.service';
import { MarketplaceEventsService } from '../marketplace-events.service';
import { AcceptGlobalOfferEventHandler } from '../handlers/acceptGlobalOffer-event.handler';
import { AcceptOfferEventHandler } from '../handlers/acceptOffer-event.handler';
import { BidEventHandler } from '../handlers/bid-event.handler';
import { BuyEventHandler } from '../handlers/buy-event.handler';
import { EndAuctionEventHandler } from '../handlers/endAuction-event.handler';
import { SendOfferEventHandler } from '../handlers/sendOffer-event.handler';
import { StartAuctionEventHandler } from '../handlers/startAuction-event.handler';
import { SwapUpdateEventHandler } from '../handlers/swapUpdate-event.handler';
import { UpdateListingEventHandler } from '../handlers/updateListing-event.handler';
import { UpdatePriceEventHandler } from '../handlers/updatePrice-event.handler';
import { WithdrawAuctionEventHandler } from '../handlers/withdrawAuction-event.handler';
import { WithdrawOfferEventHandler } from '../handlers/withdrawOffer-event.handler';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { MarketplacesModuleGraph } from 'src/modules/marketplaces/marketplaces.module';
import { NotificationsModuleGraph } from 'src/modules/notifications/notifications.module';
import { OrdersModuleGraph } from 'src/modules/orders/orders.module';
import { FeedEventsSenderService } from '../feed-events.service';
import { OffersModuleGraph } from 'src/modules/offers/offers.module';

@Module({
  imports: [
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => NotificationsModuleGraph),
    forwardRef(() => MarketplacesModuleGraph),
    forwardRef(() => OffersModuleGraph),
  ],
  providers: [
    DisabledMarketplaceEventsService,
    MarketplaceEventsService,
    BuyEventHandler,
    BidEventHandler,
    StartAuctionEventHandler,
    EndAuctionEventHandler,
    WithdrawAuctionEventHandler,
    AcceptGlobalOfferEventHandler,
    SendOfferEventHandler,
    AcceptOfferEventHandler,
    WithdrawOfferEventHandler,
    UpdatePriceEventHandler,
    UpdateListingEventHandler,
    SwapUpdateEventHandler,
    FeedEventsSenderService,
  ],
  exports: [DisabledMarketplaceEventsService],
})
export class DisabledMarketplaceEventsModule {}
