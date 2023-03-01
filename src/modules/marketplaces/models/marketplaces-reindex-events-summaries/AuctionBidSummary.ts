import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum, AuctionEventEnum } from 'src/modules/assets/models';
import { BidEvent } from 'src/modules/rabbitmq/entities/auction';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionBidSummary extends ReindexGenericSummary {
  auctionId: number;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  price: string;

  constructor(init?: Partial<AuctionBidSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromBidEventsAndTx(
    events: MarketplaceEventsEntity[],
    tx: MarketplaceTransactionData,
  ): AuctionBidSummary[] {
    const bidEvents = events.filter(
      (e) => e.data?.eventData?.identifier === AuctionEventEnum.BidEvent,
    );
    return bidEvents.map((e) => this.fromBidEventAndTx(e, tx));
  }

  private static fromBidEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): AuctionBidSummary {
    if (!event) {
      return;
    }

    const address = event.data.eventData?.address ?? tx.receiver;
    const genericEvent = event.data.eventData
      ? GenericEvent.fromEventResponse(event.data.eventData)
      : undefined;
    const topics = new BidEvent(genericEvent).getTopics();

    return new AuctionBidSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      itemsCount: topics.nrAuctionTokens,
      address: topics.currentWinner,
      sender: address,
      price: topics.currentBid,
      action: AssetActionEnum.Bid,
    });
  }
}
