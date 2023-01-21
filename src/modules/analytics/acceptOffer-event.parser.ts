import { Injectable } from '@nestjs/common';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { XOXNO_KEY } from 'src/utils/constants';
import { AcceptOfferEvent } from '../rabbitmq/entities/auction/acceptOffer.event';
import { AcceptOfferXoxnoEvent } from '../rabbitmq/entities/auction/acceptOfferXoxno.event';

@Injectable()
export class AcceptOfferEventParser {
  constructor(private readonly marketplaceService: MarketplacesService) {}

  async handle(event: any) {
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(
      event.address,
    );

    if (marketplace.key === XOXNO_KEY) {
      const acceptOfferEvent = new AcceptOfferXoxnoEvent(event);
      const topics = acceptOfferEvent.getTopics();

      return {
        paymentToken: topics.paymentTokenIdentifier,
        paymentNonce: topics.paymentTokenNonce,
        collection: topics.collection,
        value: topics.paymentAmount,
      };
    }

    const acceptOfferEvent = new AcceptOfferEvent(event);
    const topics = acceptOfferEvent.getTopics();

    return {
      paymentToken: topics.paymentTokenIdentifier,
      paymentNonce: topics.paymentTokenNonce,
      collection: topics.collection,
      value: topics.paymentAmount,
    };
  }
}
