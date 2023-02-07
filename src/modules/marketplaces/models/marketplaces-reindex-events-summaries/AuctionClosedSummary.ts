import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class ReindexAuctionClosedSummary extends ReindexGenericSummary {
  auctionId: string;
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
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): ReindexAuctionClosedSummary {
    throw new Error('Not implemented yet');
  }
}
