import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionEventEnum } from 'src/modules/assets/models';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { WithdrawEvent } from 'src/modules/rabbitmq/entities/auction';
import { AcceptOfferEvent } from 'src/modules/rabbitmq/entities/auction/acceptOffer.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionClosedAndOfferAcceptedSummary extends ReindexGenericSummary {
  auctionId: number;
  offerId: number;
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

  constructor(init?: Partial<AuctionClosedAndOfferAcceptedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromWithdrawAuctionAndAcceptOfferEventsAndTx(
    eventsSet: MarketplaceEventsEntity[],
    tx: MarketplaceTransactionData,
  ): AuctionClosedAndOfferAcceptedSummary {
    const withdrawAuctionEvent = eventsSet.find(
      (e) =>
        Buffer.from(
          e.data.eventData?.topics?.[0] ?? '',
          'base64',
        ).toString() === AuctionEventEnum.Withdraw_event,
    );
    const acceptOfferEvent = eventsSet.find(
      (e) =>
        Buffer.from(
          e.data.eventData?.topics?.[0] ?? '',
          'base64',
        ).toString() === AuctionEventEnum.Withdraw_event,
    );

    const withdrawAuctionTopics = new WithdrawEvent(
      GenericEvent.fromEventResponse(withdrawAuctionEvent.data.eventData),
    ).getTopics();
    const acceptOfferTopics = new AcceptOfferEvent(
      GenericEvent.fromEventResponse(acceptOfferEvent.data.eventData),
    ).getTopics();

    return new AuctionClosedAndOfferAcceptedSummary({
      timestamp: withdrawAuctionEvent.timestamp,
      blockHash: tx?.blockHash,
      collection: withdrawAuctionTopics.collection,
      nonce: withdrawAuctionTopics.nonce,
      identifier: `${withdrawAuctionTopics.collection}-${withdrawAuctionTopics.nonce}`,
      auctionId: BinaryUtils.hexToNumber(withdrawAuctionTopics.auctionId),
      offerId: acceptOfferTopics.offerId,
      itemsCount: acceptOfferTopics.nrOfferTokens.toString(),
      address: acceptOfferTopics.offerOwner,
      sender: acceptOfferTopics.nftOwner,
      price: acceptOfferTopics.paymentAmount,
      paymentToken: acceptOfferTopics.paymentTokenIdentifier,
      paymentNonce: acceptOfferTopics.paymentTokenNonce,
      startTime: parseInt(acceptOfferTopics.startdate),
      endTime: parseInt(acceptOfferTopics.enddate),
      action: AssetOfferEnum.AuctionClosedAndOfferAccepted,
    });
  }
}
