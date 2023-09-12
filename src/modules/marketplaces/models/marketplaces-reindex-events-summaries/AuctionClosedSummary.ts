import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import { WithdrawEvent } from 'src/modules/rabbitmq/entities/auction';
import { ClaimEvent } from 'src/modules/rabbitmq/entities/auction/claim.event';
import { ElrondSwapWithdrawEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-withdraw.event';
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

  static fromWithdrawAuctionEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData): ReindexAuctionClosedSummary {
    if (event.hasEventTopicIdentifier(ExternalAuctionEventEnum.UpdateOffer)) {
      return;
    }

    const address = event.data.eventData?.address ?? tx.receiver;
    const topics = this.getTopics(event);

    return new ReindexAuctionClosedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      itemsCount: topics.nrAuctionTokens ?? topics.boughtTokensNo,
      address,
      sender: topics.originalOwner,
      action: AssetActionEnum.ClosedAuction,
    });
  }

  private static getTopics(event: MarketplaceEventsEntity): any {
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;

    if (event.hasEventIdentifier(ExternalAuctionEventEnum.ClaimBackNft)) {
      return new ClaimEvent(genericEvent).getTopics();
    }

    if (event.hasEventIdentifier(KroganSwapAuctionEventEnum.WithdrawSwap)) {
      return new ElrondSwapWithdrawEvent(genericEvent).getTopics();
    }

    return new WithdrawEvent(genericEvent).getTopics();
  }
}
