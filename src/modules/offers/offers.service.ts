import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { OfferEntity } from 'src/db/offers';
import { OffersFilters } from './models/Offers-Filters';
import { Offer, OfferStatusEnum } from './models';
import { OffersFiltersForDb } from 'src/db/offers/offers.filter';
import { OffersCachingService } from './caching/offers-caching.service';

@Injectable()
export class OffersService {
  constructor(private persistenceService: PersistenceService, private offersCachingService: OffersCachingService) {}

  async getOffers(filters?: OffersFilters, offset: number = 0, limit: number = 10): Promise<[Offer[], number]> {
    if (filters?.ownerAddress) {
      return await this.getOffersForAddress(filters, offset, limit);
    }

    if (filters?.collectionIdentifier) {
      return await this.getOffersForCollection(filters, offset, limit);
    }

    return await this.getOffersFromDb(filters, offset, limit);
  }

  private async getOffersFromDb(filters: OffersFilters, offset: number, limit: number): Promise<[Offer[], number]> {
    let [offers, count] = await this.persistenceService.getOffers(OffersFiltersForDb.formInputFilters(filters), offset, limit);
    return [offers.map((o) => Offer.fromEntity(o)), count];
  }

  public async getOffersForAddress(filters: OffersFilters, offset: number = 0, limit: number = 10): Promise<[Offer[], number]> {
    let [offers] = await this.offersCachingService.getOrSetOffersForAddress(filters.ownerAddress, () =>
      this.persistenceService.getOffers(
        new OffersFiltersForDb({
          ownerAddress: filters.ownerAddress,
          status: [OfferStatusEnum.Active, OfferStatusEnum.Expired],
        }),
        0,
        1000,
      ),
    );

    if (filters.collectionIdentifier) {
      offers = offers.filter((o) => o.collection === filters.collectionIdentifier);
    }

    offers = this.filterByCommonProperties(filters, offers);
    offers.slice(offset, offset + limit);

    return [offers.map((o) => Offer.fromEntity(o)), offers.length];
  }

  private async getOffersForCollection(filters: OffersFilters, offset: number, limit: number): Promise<[Offer[], number]> {
    let [offers] = await this.offersCachingService.getOrSetOffersForCollection(filters.ownerAddress, () =>
      this.persistenceService.getOffers(
        new OffersFiltersForDb({
          collection: filters.collectionIdentifier,
        }),
        0,
        1000,
      ),
    );

    if (filters.ownerAddress) {
      offers = offers.filter((o) => o.ownerAddress === filters.ownerAddress);
    }

    offers = this.filterByCommonProperties(filters, offers);
    offers.slice(offset, offset + limit);

    return [offers.map((o) => Offer.fromEntity(o)), offers.length];
  }

  async getOfferById(id: number): Promise<OfferEntity> {
    return await this.persistenceService.getOfferById(id);
  }

  async getOfferByIdAndMarketplace(id: number, marketplaceKey: string): Promise<OfferEntity> {
    return await this.persistenceService.getOfferByIdAndMarketplace(id, marketplaceKey);
  }

  async saveOffer(offer: OfferEntity): Promise<OfferEntity> {
    return await this.persistenceService.saveOffer(offer);
  }

  private filterByCommonProperties(filters: OffersFilters, offers: OfferEntity[]) {
    if (filters.identifier) {
      offers = offers.filter((o) => o.identifier === filters.identifier);
    }
    if (filters.marketplaceKey) {
      offers = offers.filter((o) => o.marketplaceKey === filters.marketplaceKey);
    }
    if (filters.priceToken) {
      offers = offers.filter((o) => o.priceToken === filters.priceToken);
    }

    if (filters.status) {
      offers = offers.filter((o) => filters.status.includes(o.status));
    }
    return offers;
  }
}
