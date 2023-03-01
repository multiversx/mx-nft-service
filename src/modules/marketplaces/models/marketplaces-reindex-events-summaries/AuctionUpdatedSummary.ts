import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum } from 'src/modules/assets/models';
import { UpdateListingEvent } from 'src/modules/rabbitmq/entities/auction/updateListing.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { AuctionPriceUpdatedSummary } from './AuctionPriceUpdated';

@ObjectType()
export class AuctionUpdatedSummary extends AuctionPriceUpdatedSummary {
  paymentToken: string;
  paymentNonce: string;
  deadline: number;

  constructor(init?: Partial<AuctionUpdatedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromUpdateListingEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): AuctionUpdatedSummary {
    const address = event.data.eventData?.address ?? tx.receiver;
    const genericEvent = event.data.eventData
      ? GenericEvent.fromEventResponse(event.data.eventData)
      : undefined;
    const topics = new UpdateListingEvent(genericEvent).getTopics();

    return new AuctionUpdatedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      sender: address,
      price: topics.newBid,
      paymentToken: topics.paymentToken,
      paymentNonce: topics.paymentTokenNonce,
      deadline: topics.deadline,
      action: AssetActionEnum.Updated,
    });
  }
}
