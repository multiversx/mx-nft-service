import { ObjectType } from '@nestjs/graphql';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';
import { MarketplaceTransactionData } from '../marketplaceEventAndTxData.dto';
import { ReindexGenericSummary } from './ReindexGenericSummary';

@ObjectType()
export class OfferCreatedSummary extends ReindexGenericSummary {
  offerId: string;
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

  constructor(init?: Partial<OfferCreatedSummary>) {
    super(init);
    Object.assign(this, init);
  }

  static fromSendOfferEventAndTx(
    event: MarketplaceEventsEntity,
    tx: MarketplaceTransactionData,
  ): OfferCreatedSummary {
    throw new Error('Not implemented yet');
  }
}
