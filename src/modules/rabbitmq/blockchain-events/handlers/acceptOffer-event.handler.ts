import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersService } from 'src/modules/offers/offers.service';
import { FRAMEIT_KEY, XOXNO_KEY } from 'src/utils/constants';
import { AcceptOfferEvent } from '../../entities/auction/acceptOffer.event';
import { AcceptOfferXoxnoEvent } from '../../entities/auction/acceptOfferXoxno.event';
import { FeedEventsSenderService } from '../feed-events.service';
import { AcceptOfferFrameitEvent } from '../../entities/auction/acceptOfferFrameit.event';

@Injectable()
export class AcceptOfferEventHandler {
  private readonly logger = new Logger(AcceptOfferEventHandler.name);
  constructor(
    private readonly auctionsGetterService: AuctionsGetterService,
    private readonly auctionsService: AuctionsSetterService,
    private readonly offersService: OffersService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
    private readonly feedEventsSenderService: FeedEventsSenderService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const generalMarketplace = await this.marketplaceService.getMarketplaceByType(event.address, marketplaceType);

    if (generalMarketplace?.type === MarketplaceTypeEnum.External) {
      let acceptOfferEvent = undefined;
      let topics = undefined;
      if (generalMarketplace.key === XOXNO_KEY) {
        acceptOfferEvent = new AcceptOfferXoxnoEvent(event);
        topics = acceptOfferEvent.getTopics();
      }
      if (generalMarketplace.key === FRAMEIT_KEY) {
        acceptOfferEvent = new AcceptOfferFrameitEvent(event);
        topics = acceptOfferEvent.getTopics();
      }
      if (!acceptOfferEvent) return;

      this.logger.log(
        `${acceptOfferEvent.getIdentifier()} event detected for hash '${hash}' and marketplace '${generalMarketplace?.name}'`,
      );

      if (topics.auctionId || topics.auctionId !== 0) {
        let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(topics.auctionId, generalMarketplace.key);
        if (!auction) return;

        auction.status = AuctionStatusEnum.Closed;
        auction.modifiedDate = new Date(new Date().toUTCString());
        this.auctionsService.updateAuction(auction, ExternalAuctionEventEnum.AcceptOffer);
      }
      return;
    }

    const acceptOfferEvent = new AcceptOfferEvent(event);
    const topics = acceptOfferEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      acceptOfferEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );
    this.logger.log(`Accept Offer event detected for hash '${hash}' and marketplace '${marketplace?.name}'`);

    const offer = await this.offersService.getOfferByIdAndMarketplace(topics.offerId, marketplace.key);

    await this.offersService.saveOffer({
      ...offer,
      status: OfferStatusEnum.Accepted,
      modifiedDate: new Date(new Date().toUTCString()),
    });

    await this.feedEventsSenderService.sendAcceptOfferEvent(topics.nftOwner, offer);
    await this.notificationsService.updateNotificationStatusForOffers([offer.identifier]);
  }
}
