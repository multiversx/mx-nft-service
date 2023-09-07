import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { AcceptGlobalOfferEvent } from 'src/modules/rabbitmq/entities/auction/acceptGlobalOffer.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class GlobalOfferAcceptedSummary extends ReindexGenericSummary {
  auctionId: number;
  auctionType: AssetOfferEnum;

  constructor(init?: Partial<GlobalOfferAcceptedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromAcceptGlobalOfferEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData): GlobalOfferAcceptedSummary {
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;
    const topics = new AcceptGlobalOfferEvent(genericEvent).getTopics();

    return new GlobalOfferAcceptedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      auctionId: topics.auctionId,
      action: AssetOfferEnum.GloballyAccepted,
    });
  }
}
