import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionTypeEnum, ElrondSwapAuctionTypeEnum } from 'src/modules/auctions/models';
import { AuctionTokenEvent } from 'src/modules/rabbitmq/entities/auction';
import { ElrondSwapAuctionEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-auction.event';
import { ListNftEvent } from 'src/modules/rabbitmq/entities/auction/listNft.event';
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

  static fromAuctionTokenEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData): AuctionStartedSummary {
    const txTopics = tx?.data?.split('@');
    const minBidDiff = txTopics?.[10] ? BinaryUtils.hexToNumber(txTopics?.[10]).toString() : '0';

    const address = event.data.eventData?.address ?? tx.receiver;
    const topics = this.getTopics(event);

    if (!topics || (!topics.price && !topics.minBid) || !topics.auctionType) {
      return;
    }

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
      minBid: topics.minBid ?? topics.price,
      maxBid: topics.maxBid ?? '0',
      minBidDiff: minBidDiff,
      startTime: topics.startTime ?? event.timestamp,
      endTime: topics.endTime ?? topics.deadline ?? 0,
      paymentToken: topics.paymentToken,
      paymentNonce: topics.paymentNonce ?? topics.paymentTokenNonce ?? 0,
      auctionType: Object.values(AuctionTypeEnum)[BinaryUtils.hexToNumber(topics.auctionType)],
    });
  }

  private static getTopics(event: MarketplaceEventsEntity): any {
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;

    if (event.hasEventIdentifier(KroganSwapAuctionEventEnum.NftSwap)) {
      try {
        const topics = new ElrondSwapAuctionEvent(genericEvent).getTopics();
        if (parseInt(topics.auctionType) === ElrondSwapAuctionTypeEnum.Swap) {
          return;
        }
        return topics;
      } catch {
        return;
      }
    }

    if (event.hasEventIdentifier(ExternalAuctionEventEnum.ListNftOnMarketplace)) {
      const topics = new ListNftEvent(genericEvent).getTopics();
      return {
        ...topics,
        maxBid: topics.price,
      };
    }

    return new AuctionTokenEvent(genericEvent).getTopics();
  }
}
