import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { SendOfferEvent } from 'src/modules/rabbitmq/entities/auction/sendOffer.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { Marketplace } from '../Marketplace.dto';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { MarketplaceTypeEnum } from '../MarketplaceType.enum';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class OfferCreatedSummary extends ReindexGenericSummary {
  offerId: number;
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

  constructor(init?: Partial<OfferCreatedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromSendOfferEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
    marketplace: Marketplace,
  ): OfferCreatedSummary {
    if (marketplace.type === MarketplaceTypeEnum.External) {
      return;
    }
    const address = event.data.eventData?.address ?? tx.receiver;
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;
    const topics = new SendOfferEvent(genericEvent).getTopics();

    return new OfferCreatedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      offerId: topics.offerId,
      itemsCount: topics.nrOfferTokens.toString(),
      address: topics.offerOwner,
      sender: address,
      price: topics.paymentAmount,
      paymentToken: topics.paymentTokenIdentifier,
      paymentNonce: topics.paymentTokenNonce,
      startTime: parseInt(topics.startdate),
      endTime: parseInt(topics.enddate),
      action: AssetOfferEnum.Created,
    });
  }
}
