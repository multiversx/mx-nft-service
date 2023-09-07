import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { WithdrawOfferEvent } from 'src/modules/rabbitmq/entities/auction/withdrawOffer.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class OfferClosedSummary extends ReindexGenericSummary {
  offerId: number;
  auctionType: AssetOfferEnum;

  identifier: string;
  collection: string;
  nonce: string;

  constructor(init?: Partial<OfferClosedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromWithdrawOfferEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData): OfferClosedSummary {
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;
    const topics = new WithdrawOfferEvent(genericEvent).getTopics();

    return new OfferClosedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      offerId: topics.offerId,
      action: AssetOfferEnum.Closed,
    });
  }
}
