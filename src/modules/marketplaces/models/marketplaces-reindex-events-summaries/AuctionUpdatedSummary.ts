import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum, KroganSwapAuctionEventEnum } from 'src/modules/assets/models';
import { ElrondSwapUpdateEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-updateAuction.event';
import { UpdateListingEvent } from 'src/modules/rabbitmq/entities/auction/updateListing.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionUpdatedSummary extends ReindexGenericSummary {
  auctionId: number;

  identifier: string;
  collection: string;
  nonce: string;

  minBid: string;
  deadline: number;
  paymentToken?: string;
  paymentNonce?: string;

  constructor(init?: Partial<AuctionUpdatedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromUpdateListingEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData): AuctionUpdatedSummary {
    const address = event.data.eventData?.address ?? tx.receiver;
    const topics = this.getTopics(event);

    return new AuctionUpdatedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      sender: address,
      minBid: topics.newBid ?? topics.price,
      paymentToken: topics.paymentToken,
      paymentNonce: topics.paymentTokenNonce,
      deadline: topics.deadline,
      action: AssetActionEnum.Updated,
    });
  }

  private static getTopics(event: MarketplaceEventsEntity): any {
    const genericEvent = event.data.eventData ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;

    if (event.hasOneOfEventIdentifiers([KroganSwapAuctionEventEnum.NftSwapUpdate, KroganSwapAuctionEventEnum.NftSwapExtend])) {
      return new ElrondSwapUpdateEvent(genericEvent).getTopics();
    }

    return new UpdateListingEvent(genericEvent).getTopics();
  }
}
