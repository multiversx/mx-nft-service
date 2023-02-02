import { BinaryUtils } from '@elrondnetwork/erdnest';
import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum, AuctionEventEnum } from 'src/modules/assets/models';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import {
  AuctionTokenEvent,
  WithdrawEvent,
  EndAuctionEvent,
  BuySftEvent,
  BidEvent,
} from 'src/modules/rabbitmq/entities/auction';
import { AcceptOfferEvent } from 'src/modules/rabbitmq/entities/auction/acceptOffer.event';
import { SendOfferEvent } from 'src/modules/rabbitmq/entities/auction/sendOffer.event';
import { WithdrawOfferEvent } from 'src/modules/rabbitmq/entities/auction/withdrawOffer.event';
import { GenericEvent } from 'src/modules/rabbitmq/entities/generic.event';

@ObjectType()
export class MarketplaceEventLogInput {
  action: AssetActionEnum | AssetOfferEnum;
  blockHash?: string;
  timestamp: number;
  address: string;
  sender: string;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  startTime?: number;
  endTime?: number;

  auctionId: string;
  auctionType?: AuctionTypeEnum;

  offerId: string;

  paymentToken?: string;
  paymentNonce?: number;

  price: string;
  minBid?: string;
  maxBid?: string;
  minBidDiff?: string;

  constructor(init?: Partial<MarketplaceEventLogInput>) {
    Object.assign(this, init);
  }

  static fromInternalMarketplaceEventAndTx(
    events: MarketplaceEventsEntity[],
    eventType: string,
    index: number,
  ): MarketplaceEventLogInput {
    const txData = events.find((event) => event.isTx)?.data?.txData;
    const txTopics = txData?.data?.split('@');
    const address =
      events[index].data.eventData?.address ??
      events[index].data.txData.receiver;
    const event = events[index].data.eventData
      ? GenericEvent.fromEventResponse(events[index].data.eventData)
      : undefined;

    switch (eventType) {
      case AuctionEventEnum.AuctionTokenEvent: {
        const topics = new AuctionTokenEvent(event).getTopics();
        const minBidDiff = txTopics?.[10]
          ? BinaryUtils.hexToNumber(txTopics?.[10]).toString()
          : '0';
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          auctionId: topics.auctionId,
          itemsCount: topics.nrAuctionTokens,
          address,
          sender: topics.originalOwner,
          action: AssetActionEnum.StartedAuction,
          minBid: topics.minBid,
          maxBid: topics.maxBid,
          minBidDiff: minBidDiff,
          startTime: topics.startTime,
          endTime: topics.endTime,
          paymentToken: topics.paymentToken,
          paymentNonce: topics.paymentNonce,
          auctionType:
            Object.values(AuctionTypeEnum)[
              BinaryUtils.hexToNumber(topics.auctionType)
            ],
        });
      }
      case AuctionEventEnum.WithdrawEvent: {
        const topics = new WithdrawEvent(event).getTopics();
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          auctionId: topics.auctionId,
          itemsCount: topics.nrAuctionTokens,
          address,
          sender: topics.originalOwner,
          action: AssetActionEnum.ClosedAuction,
        });
      }
      case AuctionEventEnum.EndAuctionEvent: {
        const topics = new EndAuctionEvent(event).getTopics();
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          auctionId: topics.auctionId,
          itemsCount: topics.nrAuctionTokens,
          action: AssetActionEnum.EndedAuction,
          address: topics.currentWinner,
          sender: address,
        });
      }
      case AuctionEventEnum.BuySftEvent: {
        const topics = new BuySftEvent(event).getTopics();
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          auctionId: topics.auctionId,
          itemsCount: topics.boughtTokens,
          action: AssetActionEnum.Bought,
          address: topics.currentWinner,
          sender: address,
          price: topics.bid,
        });
      }
      case AuctionEventEnum.BidEvent: {
        const topics = new BidEvent(event).getTopics();
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          auctionId: topics.auctionId,
          itemsCount: topics.nrAuctionTokens,
          address: topics.currentWinner,
          sender: address,
          price: topics.currentBid,
        });
      }
      case AuctionEventEnum.SendOffer: {
        const topics = new SendOfferEvent(event).getTopics();
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          offerId: topics.offerId.toString(),
          itemsCount: topics.nrOfferTokens.toString(),
          address: topics.offerOwner,
          sender: address,
          price: topics.paymentAmount,
          paymentToken: topics.paymentTokenIdentifier,
          paymentNonce: topics.paymentTokenNonce,
          startTime: parseInt(topics.startdate),
          endTime: parseInt(topics.enddate),
          action: AssetOfferEnum.Created,
        });
      }
      case AuctionEventEnum.AcceptOffer: {
        const topics = new AcceptOfferEvent(event).getTopics();
        console.log(JSON.stringify(topics));
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          itemsCount: topics.nrOfferTokens.toString(),
          auctionId: topics.auctionId.toString(),
          offerId: topics.offerId.toString(),
          address: topics.offerOwner,
          sender: topics.nftOwner,
          price: topics.paymentAmount,
          paymentToken: topics.paymentTokenIdentifier,
          paymentNonce: topics.paymentTokenNonce,
          action: AssetOfferEnum.Accepted,
        });
      }
      case AuctionEventEnum.WithdrawOffer: {
        const topics = new WithdrawOfferEvent(event).getTopics();
        console.log(JSON.stringify(topics));
        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: topics.collection,
          nonce: topics.nonce,
          identifier: `${topics.collection}-${topics.nonce}`,
          offerId: topics.offerId.toString(),
          action: AssetOfferEnum.Closed,
        });
      }
      case AuctionEventEnum.WithdrawAuctionAndAcceptOffer: {
        const withdrawOfferGenericEvent =
          this.getGenericEventForEventIdentifier(
            events,
            AuctionEventEnum.Withdraw_event,
          );
        const withdrawTopics = new WithdrawEvent(
          withdrawOfferGenericEvent,
        ).getTopics();

        const acceptOfferGenericEvent = this.getGenericEventForEventIdentifier(
          events,
          AuctionEventEnum.Accept_offer_token_event,
        );
        const acceptOfferTopics = new AcceptOfferEvent(
          acceptOfferGenericEvent,
        ).getTopics();

        return new MarketplaceEventLogInput({
          timestamp: events[index].timestamp,
          blockHash: txData?.blockHash,
          collection: withdrawTopics.collection,
          nonce: withdrawTopics.nonce,
          identifier: `${withdrawTopics.collection}-${withdrawTopics.nonce}`,
          auctionId: withdrawTopics.auctionId,
          offerId: acceptOfferTopics.offerId.toString(),
          itemsCount: acceptOfferTopics.nrOfferTokens.toString(),
          address: acceptOfferTopics.offerOwner,
          sender: acceptOfferTopics.nftOwner,
          price: acceptOfferTopics.paymentAmount,
          paymentToken: acceptOfferTopics.paymentTokenIdentifier,
          paymentNonce: acceptOfferTopics.paymentTokenNonce,
          action: AssetOfferEnum.AuctionClosedAndOfferAccepted,
        });
      }
      default: {
        throw new Error('Unhandled marketplace event');
      }
    }
  }

  static fromExternalMarketplaceEventAndTx(
    events: MarketplaceEventsEntity[],
    eventType: string,
    index: number,
  ): MarketplaceEventLogInput {
    throw new Error('Not implemented yet');
  }

  static fromElrondNftSwapMarketplaceEventAndTx(
    events: MarketplaceEventsEntity[],
    eventType: string,
    index: number,
  ): MarketplaceEventLogInput {
    throw new Error('Not implemented yet');
  }

  private static getGenericEventForEventIdentifier(
    events: MarketplaceEventsEntity[],
    eventIdentifier: string,
  ): GenericEvent {
    const withdrawEvent = events.find(
      (e) =>
        Buffer.from(
          e.data.eventData?.topics?.[0] ?? '',
          'base64',
        ).toString() === eventIdentifier,
    );
    const withdrawEventData = GenericEvent.fromEventResponse(
      withdrawEvent.data.eventData,
    );
    return withdrawEventData;
  }
}
