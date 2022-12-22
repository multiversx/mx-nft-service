import { Injectable, Logger } from '@nestjs/common';
import { OfferEntity } from 'src/db/offers';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersService } from 'src/modules/offers/offers.service';
import { SendOfferEvent } from '../../entities/auction/sendOffer.event';
import { FeedEventsSenderService } from '../feed-events.service';

@Injectable()
export class SendOfferEventHandler {
  private readonly logger = new Logger(SendOfferEventHandler.name);
  constructor(
    private readonly offersService: OffersService,
    private readonly feedEventsSenderService: FeedEventsSenderService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const sendOffer = new SendOfferEvent(event);
    const topics = sendOffer.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      sendOffer.getAddress(),
      marketplaceType,
      topics.collection,
    );

    if (!marketplace) return;
    this.logger.log(
      `Send Offer event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
    );

    const offer = await this.offersService.saveOffer(
      OfferEntity.fromEventTopics(
        topics,
        hash,
        marketplace.key,
        OfferStatusEnum.Active,
      ),
    );

    if (!offer) return;
    await this.feedEventsSenderService.sendOfferEvent(offer);
  }
}
