import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersFilters } from 'src/modules/offers/models/Offers-Filters';

export class OffersFiltersForDb {
  ownerAddress: string;
  identifier: string;
  collection: string;
  marketplaceKey: string;
  priceToken: string;
  status: OfferStatusEnum[] = [OfferStatusEnum.Active];
  constructor(init?: Partial<OffersFiltersForDb>) {
    Object.assign(this, init);
  }

  static formInputFilters(filters: OffersFilters): OffersFiltersForDb {
    if (!filters) return new OffersFiltersForDb();
    return new OffersFiltersForDb({
      identifier: filters.identifier,
      marketplaceKey: filters.marketplaceKey,
      ownerAddress: filters.ownerAddress,
      priceToken: filters.priceToken,
      status: filters.status,
      collection: filters.collectionIdentifier,
    });
  }
}
