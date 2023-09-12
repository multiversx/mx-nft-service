import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum } from 'src/modules/assets/models';
import { UpdatePriceEvent } from 'src/modules/rabbitmq/entities/auction/updatePrice.event';
import { UpdatePriceDeadrareEvent } from 'src/modules/rabbitmq/entities/auction/updatePriceDeadrare.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { DEADRARE_KEY } from 'src/utils/constants';
import { Marketplace } from '../Marketplace.dto';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionPriceUpdatedSummary extends ReindexGenericSummary {
  auctionId: number;

  identifier: string;
  collection: string;
  nonce: string;

  minBid: string;
  maxBid?: string;
  itemsCount?: number;
  paymentToken?: string;

  constructor(init?: Partial<AuctionPriceUpdatedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromUpdatePriceEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
    marketplace: Marketplace,
  ): AuctionPriceUpdatedSummary {
    const address = event.data.eventData?.address ?? tx.receiver;

    const topics = this.getTopics(event, marketplace);

    return new AuctionPriceUpdatedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(topics.auctionId),
      sender: address,
      minBid: topics.newBid ?? topics.minBid,
      maxBid: topics.maxBid,
      paymentToken: topics.paymentToken,
      itemsCount: topics.itemsCount,
      action: AssetActionEnum.PriceUpdated,
    });
  }

  private static getTopics(event: MarketplaceEventsEntity, marketplace: Marketplace): any {
    const genericEvent = event.data.eventData ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;

    if (marketplace.key === DEADRARE_KEY) {
      return new UpdatePriceDeadrareEvent(genericEvent).getTopics();
    }

    return new UpdatePriceEvent(genericEvent).getTopics();
  }
}
