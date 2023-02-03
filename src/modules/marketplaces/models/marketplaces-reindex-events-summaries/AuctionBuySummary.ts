import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionTypeEnum } from 'src/modules/auctions/models';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class AuctionBuySummary extends ReindexGenericSummary {
  auctionId: string;
  auctionType: AuctionTypeEnum;

  identifier: string;
  collection: string;
  nonce: string;
  itemsCount: string;

  price: string;

  constructor(init?: Partial<AuctionBuySummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromBuySftEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): AuctionBuySummary {
    throw new Error('Not implemented yet');
  }
}
