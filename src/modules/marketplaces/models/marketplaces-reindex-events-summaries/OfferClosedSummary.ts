import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class OfferClosedSummary extends ReindexGenericSummary {
  offerId: string;
  auctionType: AssetOfferEnum;

  identifier: string;
  collection: string;
  nonce: string;

  constructor(init?: Partial<OfferClosedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromWithdrawOfferEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): OfferClosedSummary {
    throw new Error('Not implemented yet');
  }
}
