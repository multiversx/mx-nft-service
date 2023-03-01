import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import {
  AssetActionEnum,
  ElrondNftsSwapAuctionEventEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
import { BuySftEvent } from 'src/modules/rabbitmq/entities/auction';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionBuySummary extends ReindexGenericSummary {
  auctionId: number;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  price: string;

  constructor(init?: Partial<AuctionBuySummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromBuySftEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): AuctionBuySummary {
    const eventName = Buffer.from(
      event.data.eventData?.topics?.[0],
      'base64',
    ).toString();
    if (
      eventName === ExternalAuctionEventEnum.UpdateOffer ||
      eventName === ElrondNftsSwapAuctionEventEnum.UpdateListing
    ) {
      return;
    }

    const address = event.data.eventData?.address ?? tx.receiver;
    const genericEvent = event.data
      ? GenericEvent.fromEventResponse(event.data.eventData)
      : undefined;
    const topics = new BuySftEvent(genericEvent).getTopics();

    return new AuctionBuySummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      itemsCount: topics.boughtTokens,
      action: AssetActionEnum.Bought,
      address: topics.currentWinner,
      sender: address,
      price: topics.bid,
    });
  }

  static fromBulkBuyEventAndTx(
    events: MarketplaceEventsEntity[],
    tx: MarketplaceTransactionData,
  ): AuctionBuySummary[] {
    const buyEvents = events.filter(
      (e) => e.data?.eventData?.identifier === ExternalAuctionEventEnum.BulkBuy,
    );
    return buyEvents.map((e) => this.fromBuySftEventAndTx(e, tx));
  }
}
