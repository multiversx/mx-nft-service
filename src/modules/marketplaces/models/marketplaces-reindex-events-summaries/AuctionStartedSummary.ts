import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionStartedSummary extends ReindexGenericSummary {
  auctionId: string;
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
    throw new Error('Not implemented yet');
  }
}
