import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum } from 'src/modules/assets/models';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import { EndAuctionEvent } from 'src/modules/rabbitmq/entities/auction';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionEndedSummary extends ReindexGenericSummary {
  auctionId: number;
  auctionType: AuctionTypeEnum;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  currentBid: string;
  currentWinner: string;

  constructor(init?: Partial<AuctionEndedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromEndAuctionEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData): AuctionEndedSummary {
    const address = event.data.eventData?.address ?? tx.receiver;
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;
    const topics = new EndAuctionEvent(genericEvent).getTopics();

    return new AuctionEndedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      itemsCount: topics.nrAuctionTokens,
      address,
      currentBid: topics.currentBid,
      currentWinner: topics.currentWinner,
      action: AssetActionEnum.EndedAuction,
    });
  }
}
