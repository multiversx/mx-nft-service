import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { OfferEntity } from 'src/db/offers';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersService } from 'src/modules/offers/offers.service';
import { SendOfferEvent } from '../../entities/auction-reindex/sendOffer.event';
import { FeedEventsSenderService } from '../feed-events.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { EventLog } from 'src/modules/metrics/rabbitEvent';

@Injectable()
export class SendOfferEventHandler {
  private readonly logger = new Logger(SendOfferEventHandler.name);
  constructor(
    private readonly offersService: OffersService,
    private readonly feedEventsSenderService: FeedEventsSenderService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) { }

  async handle(event: EventLog, marketplace: Marketplace) {
    try {
      if (marketplace.type === MarketplaceTypeEnum.External) {
        return;
      }
      const sendOffer = new SendOfferEvent(event);
      const topics = sendOffer.getTopics();
      marketplace = await this.marketplaceService.getMarketplaceByType(sendOffer.address, marketplace.type, topics.collection);

      if (!marketplace) {
        return;
      }

      this.logger.log(`Send Offer event detected for marketplace '${marketplace?.name}'`);

      const offer = await this.offersService.saveOffer(OfferEntity.fromEventTopics(topics, 'hash', marketplace.key, OfferStatusEnum.Active));

      if (!offer) return;
      await this.feedEventsSenderService.sendOfferEvent(offer);
      await this.notificationsService.addNotificationForOffer(offer);
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }
}
