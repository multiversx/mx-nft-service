import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum } from 'src/modules/assets/models';
import { BidEvent } from 'src/modules/rabbitmq/entities/auction';
import { ElrondSwapBidEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-bid.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
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

  static fromBidEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData, marketplaceKey: string): AuctionBidSummary {
    if (!event || event.hasEventTopicIdentifier('end_auction_event')) {
      return;
    }

    const address = event.data.eventData?.address ?? tx.receiver;
    const topics = this.getTopics(event, marketplaceKey);

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

  private static getTopics(event: MarketplaceEventsEntity, marketplaceKey: string): any {
    const genericEvent = event.data.eventData ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;

    if (marketplaceKey === ELRONDNFTSWAP_KEY) {
      return new ElrondSwapBidEvent(genericEvent).getTopics();
    }

    return new BidEvent(genericEvent).getTopics();
  }
}
