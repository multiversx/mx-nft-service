import { Injectable } from '@nestjs/common';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { DEADRARE_KEY, FRAMEIT_KEY, XOXNO_KEY } from 'src/utils/constants';
import { AcceptOfferEvent } from '../rabbitmq/entities/auction/acceptOffer.event';
import { AcceptOfferDeadrareEvent } from '../rabbitmq/entities/auction/acceptOfferDeadrare.event';
import { AcceptOfferFrameitEvent } from '../rabbitmq/entities/auction/acceptOfferFrameit.event';
import { AcceptOfferXoxnoEvent } from '../rabbitmq/entities/auction/acceptOfferXoxno.event';

@Injectable()
export class AcceptOfferEventParser {
  constructor(private readonly marketplaceService: MarketplacesService) {}

  async handle(event: any) {
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(
      event.address,
    );
    let acceptOfferEvent = undefined;
    let topics = undefined;

    if (marketplace.key === XOXNO_KEY) {
      acceptOfferEvent = new AcceptOfferXoxnoEvent(event);
      topics = acceptOfferEvent.getTopics();
    }

    if (marketplace.key === DEADRARE_KEY) {
      acceptOfferEvent = new AcceptOfferDeadrareEvent(event);
      topics = acceptOfferEvent.getTopics();
    }

    if (marketplace.key === FRAMEIT_KEY) {
      acceptOfferEvent = new AcceptOfferFrameitEvent(event);
      topics = acceptOfferEvent.getTopics();
    }

    acceptOfferEvent = new AcceptOfferEvent(event);
    topics = acceptOfferEvent.getTopics();

    return {
      paymentToken: topics.paymentTokenIdentifier,
      paymentNonce: topics.paymentTokenNonce,
      collection: topics.collection,
      value: topics.paymentAmount,
    };
  }
}
