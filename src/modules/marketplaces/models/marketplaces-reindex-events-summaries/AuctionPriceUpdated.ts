import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum } from 'src/modules/assets/models';
import { UpdatePriceEvent } from 'src/modules/rabbitmq/entities/auction/updatePrice.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionPriceUpdatedSummary extends ReindexGenericSummary {
  auctionId: number;

  identifier: string;
  collection: string;
  nonce: string;

  price: string;

  constructor(init?: Partial<AuctionPriceUpdatedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromUpdatePriceEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): AuctionPriceUpdatedSummary {
    const address = event.data.eventData?.address ?? tx.receiver;
    const genericEvent = event.data.eventData
      ? GenericEvent.fromEventResponse(event.data.eventData)
      : undefined;
    const topics = new UpdatePriceEvent(genericEvent).getTopics();

    return new AuctionPriceUpdatedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      sender: address,
      price: topics.newBid,
      action: AssetActionEnum.PriceUpdated,
    });
  }
}
