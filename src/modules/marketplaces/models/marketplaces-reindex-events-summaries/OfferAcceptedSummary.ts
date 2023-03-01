import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { AcceptOfferEvent } from 'src/modules/rabbitmq/entities/auction/acceptOffer.event';
import { AcceptOfferXoxnoEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferXoxno.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { XOXNO_KEY } from 'src/utils/constants';
import { Marketplace } from '../Marketplace.dto';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { MarketplaceTypeEnum } from '../MarketplaceType.enum';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class OfferAcceptedSummary extends ReindexGenericSummary {
  offerId: number;
  auctionId?: number;
  auctionType: AssetOfferEnum;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  startTime: number;
  endTime: number;

  paymentToken: string;
  paymentNonce: number;

  price: string;

  constructor(init?: Partial<OfferAcceptedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromAcceptOfferEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
    marketplace: Marketplace,
  ): OfferAcceptedSummary {
    let topics;
    const genericEvent = event.data
      ? GenericEvent.fromEventResponse(event.data.eventData)
      : undefined;

    if (marketplace?.type === MarketplaceTypeEnum.External) {
      if (marketplace.key !== XOXNO_KEY) return;
      topics = new AcceptOfferXoxnoEvent(genericEvent).getTopics();
    } else {
      topics = new AcceptOfferEvent(genericEvent).getTopics();
    }

    return new OfferAcceptedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      itemsCount: topics.nrOfferTokens.toString(),
      offerId: topics.offerId.toString(),
      auctionId: topics?.auctionId,
      address: topics.offerOwner,
      sender: topics.nftOwner,
      price: topics.paymentAmount,
      paymentToken: topics.paymentTokenIdentifier,
      paymentNonce: topics.paymentTokenNonce,
      startTime: parseInt(topics.startdate),
      endTime: parseInt(topics.enddate),
      action: AssetOfferEnum.Accepted,
    });
  }
}
