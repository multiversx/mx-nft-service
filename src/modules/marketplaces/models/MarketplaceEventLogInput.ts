import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetActionEnum } from 'src/modules/assets/models';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { AuctionTypeEnum } from 'src/modules/auctions/models';

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

  static fromInternalMarketplaceEventAndTx(events: MarketplaceEventsEntity[], eventType: string, index: number): MarketplaceEventLogInput {
    throw new Error('Not implemented yet');
  }

  static fromExternalMarketplaceEventAndTx(events: MarketplaceEventsEntity[], eventType: string, index: number): MarketplaceEventLogInput {
    throw new Error('Not implemented yet');
  }

  static fromElrondNftSwapMarketplaceEventAndTx(
    events: MarketplaceEventsEntity[],
    eventType: string,
    index: number,
  ): MarketplaceEventLogInput {
    throw new Error('Not implemented yet');
  }
}
