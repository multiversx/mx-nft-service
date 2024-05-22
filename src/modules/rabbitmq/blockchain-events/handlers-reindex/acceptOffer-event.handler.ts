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
import { AcceptOfferEvent } from '../../entities/auction-reindex/acceptOffer.event';
import { AcceptOfferXoxnoEvent } from '../../entities/auction-reindex/acceptOfferXoxno.event';
import { FeedEventsSenderService } from '../feed-events.service';
import { AcceptOfferFrameitEvent } from '../../entities/auction-reindex/acceptOfferFrameit.event';
import { Marketplace } from 'src/modules/marketplaces/models';

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
  ) { }

  async handle(event: any, hash: string, marketplace: Marketplace) {
    try {
      if (marketplace?.type === MarketplaceTypeEnum.External) {
        let acceptOfferEvent = undefined;
        let topics = undefined;
        if (marketplace.key === XOXNO_KEY) {
          acceptOfferEvent = new AcceptOfferXoxnoEvent(event);
          topics = acceptOfferEvent.getTopics();
        }
        if (marketplace.key === FRAMEIT_KEY) {
          acceptOfferEvent = new AcceptOfferFrameitEvent(event);
          topics = acceptOfferEvent.getTopics();
        }
        if (!acceptOfferEvent) return;

        this.logger.log(
          `${acceptOfferEvent.getIdentifier()} event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
        );

        if (topics.auctionId || topics.auctionId !== 0) {
          let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(topics.auctionId, marketplace.key);
          if (!auction) return;

          auction.status = AuctionStatusEnum.Closed;
          auction.modifiedDate = new Date(new Date().toUTCString());
          this.auctionsService.updateAuction(auction, ExternalAuctionEventEnum.AcceptOffer);
        }
        return;
      }

      const acceptOfferEvent = new AcceptOfferEvent(event);
      const topics = acceptOfferEvent.getTopics();
      marketplace = await this.marketplaceService.getMarketplaceByType(
        acceptOfferEvent.getAddress(),
        marketplace.type,
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
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }
}
