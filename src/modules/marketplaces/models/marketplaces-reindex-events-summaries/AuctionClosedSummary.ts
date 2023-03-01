import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import {
  AssetActionEnum,
  AuctionEventEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import { WithdrawEvent } from 'src/modules/rabbitmq/entities/auction';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class ReindexAuctionClosedSummary extends ReindexGenericSummary {
  auctionId: number;
  auctionType: AuctionTypeEnum;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  constructor(init?: Partial<ReindexAuctionClosedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromWithdrawAuctionEventAndTx(
    events: MarketplaceEventsEntity[],
    tx: MarketplaceTransactionData,
  ): ReindexAuctionClosedSummary[] {
    const withdrawEvents = events.filter(
      (e) => e.data?.eventData?.identifier === AuctionEventEnum.WithdrawEvent,
    );

    return withdrawEvents.map((event) => {
      if (
        Buffer.from(event.data.eventData?.topics?.[0], 'base64').toString() ===
        ExternalAuctionEventEnum.UpdateOffer
      ) {
        return;
      }

      const address = event.data.eventData?.address ?? tx.receiver;
      const genericEvent = event.data
        ? GenericEvent.fromEventResponse(event.data.eventData)
        : undefined;
      const topics = new WithdrawEvent(genericEvent).getTopics();

      return new ReindexAuctionClosedSummary({
        timestamp: event.timestamp,
        blockHash: tx?.blockHash,
        collection: topics.collection,
        nonce: topics.nonce,
        identifier: `${topics.collection}-${topics.nonce}`,
        auctionId: BinaryUtils.hexToNumber(topics.auctionId),
        itemsCount: topics.nrAuctionTokens,
        address,
        sender: topics.originalOwner,
        action: AssetActionEnum.ClosedAuction,
      });
    });
  }
}
