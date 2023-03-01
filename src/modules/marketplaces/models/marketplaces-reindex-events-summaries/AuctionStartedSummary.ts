import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum } from 'src/modules/assets/models';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import { AuctionTokenEvent } from 'src/modules/rabbitmq/entities/auction';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionStartedSummary extends ReindexGenericSummary {
  auctionId: number;
  auctionType: AuctionTypeEnum;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  startTime: number;
  endTime: number;

  paymentToken: string;
  paymentNonce: number;

  minBid: string;
  maxBid: string;
  minBidDiff: string;

  constructor(init?: Partial<AuctionStartedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromAuctionTokenEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): AuctionStartedSummary {
    const txTopics = tx?.data?.split('@');
    const address = event.data.eventData?.address ?? tx.receiver;
    const genericEvent = event.data
      ? GenericEvent.fromEventResponse(event.data.eventData)
      : undefined;
    const topics = new AuctionTokenEvent(genericEvent).getTopics();
    const minBidDiff = txTopics?.[10]
      ? BinaryUtils.hexToNumber(txTopics?.[10]).toString()
      : '0';

    return new AuctionStartedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      itemsCount: topics.nrAuctionTokens,
      address,
      sender: topics.originalOwner,
      action: AssetActionEnum.StartedAuction,
      minBid: topics.minBid,
      maxBid: topics.maxBid ?? '0',
      minBidDiff: minBidDiff,
      startTime: topics.startTime,
      endTime: topics.endTime ?? 0,
      paymentToken: topics.paymentToken,
      paymentNonce: topics.paymentNonce,
      auctionType:
        Object.values(AuctionTypeEnum)[
          BinaryUtils.hexToNumber(topics.auctionType)
        ],
    });
  }
}
