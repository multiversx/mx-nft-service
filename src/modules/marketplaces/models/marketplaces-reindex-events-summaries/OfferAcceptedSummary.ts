import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { KroganSwapAuctionEventEnum } from 'src/modules/assets/models';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { AcceptOfferEvent } from 'src/modules/rabbitmq/entities/auction/acceptOffer.event';
import { AcceptOfferDeadrareEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferDeadrare.event';
import { AcceptOfferFrameitEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferFrameit.event';
import { AcceptOfferXoxnoEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferXoxno.event';
import { ElrondSwapAcceptOfferEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-acceptOffer.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { DEADRARE_KEY, ELRONDNFTSWAP_KEY, FRAMEIT_KEY, XOXNO_KEY } from 'src/utils/constants';
import { Marketplace } from '../Marketplace.dto';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class OfferAcceptedSummary extends ReindexGenericSummary {
  offerId: number;
  auctionId?: number;
  auctionType: AssetOfferEnum;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  startTime: number;
  endTime: number;

  paymentToken: string;
  paymentNonce: number;

  price: string;

  constructor(init?: Partial<OfferAcceptedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromAcceptOfferEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
    marketplace: Marketplace,
  ): OfferAcceptedSummary {
    const topics = this.getTopics(event, marketplace);

    if (!topics) {
      return;
    }

    return new OfferAcceptedSummary({
      timestamp: event.timestamp,
      blockHash: tx?.blockHash,
      collection: topics.collection,
      nonce: topics.nonce,
      identifier: `${topics.collection}-${topics.nonce}`,
      itemsCount: topics.nrOfferTokens.toString(),
      offerId: topics.offerId.toString(),
      auctionId: topics.auctionId,
      address: topics.offerOwner,
      sender: topics.nftOwner,
      price: topics.paymentAmount,
      paymentToken: topics.paymentTokenIdentifier,
      paymentNonce: topics.paymentTokenNonce,
      startTime: parseInt(topics.startdate),
      endTime: parseInt(topics.enddate),
      action: AssetOfferEnum.Accepted,
    });
  }

  private static getTopics(event: MarketplaceEventsEntity, marketplace: Marketplace): any {
    const genericEvent = event.data ? GenericEvent.fromEventResponse(event.data.eventData) : undefined;

    if (marketplace.key === XOXNO_KEY) {
      return new AcceptOfferXoxnoEvent(genericEvent).getTopics();
    }

    if (marketplace.key === DEADRARE_KEY) {
      return new AcceptOfferDeadrareEvent(genericEvent).getTopics();
    }

    if (marketplace.key === FRAMEIT_KEY) {
      return new AcceptOfferFrameitEvent(genericEvent).getTopics();
    }

    if (marketplace.key === ELRONDNFTSWAP_KEY) {
      return new ElrondSwapAcceptOfferEvent(genericEvent).getTopics();
    }

    return new AcceptOfferEvent(genericEvent).getTopics();
  }
}
