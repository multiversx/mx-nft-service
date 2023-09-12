import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { BuySftEvent } from 'src/modules/rabbitmq/entities/auction';
import { ClaimEvent } from 'src/modules/rabbitmq/entities/auction/claim.event';
import { ElrondSwapBuyEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-buy.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { DEADRARE_KEY } from 'src/utils/constants';
import { Marketplace } from '../Marketplace.dto';
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

  static fromBuySftEventAndTx(event: MarketplaceEventsEntity, tx: MarketplaceTransactionData, marketplace: Marketplace): AuctionBuySummary {
    if (event.hasOneOfEventTopicIdentifiers([ExternalAuctionEventEnum.UpdateOffer, KroganSwapAuctionEventEnum.UpdateListing])) {
      return;
    }

    const address = event.data.eventData?.address ?? tx.receiver;
    const topics = this.getTopics(event, marketplace);

    if (!topics) {
      return;
    }

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

  private static getTopics(event: MarketplaceEventsEntity, marketplace: Marketplace): any {
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;
    try {
      if (event.hasEventIdentifier(ExternalAuctionEventEnum.BuyNft) && marketplace.key !== DEADRARE_KEY) {
        return new ClaimEvent(genericEvent).getTopics();
      }

      if (event.hasEventIdentifier(KroganSwapAuctionEventEnum.Purchase)) {
        return new ElrondSwapBuyEvent(genericEvent).getTopics();
      }

      return new BuySftEvent(genericEvent).getTopics();
    } catch {
      return;
    }
  }
}
