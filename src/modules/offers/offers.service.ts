import { Injectable } from '@nestjs/common';
import '../../utils/extensions';

import { PersistenceService } from 'src/common/persistence/persistence.service';
import { OfferEntity } from 'src/db/offers';
import { OffersFilters } from './models/Offers-Filters';
import { Offer } from './models';
import { OffersFiltersForDb } from 'src/db/offers/offers.filter';

@Injectable()
export class OffersService {
  constructor(private persistenceService: PersistenceService) {}

  async getOffers(
    filters?: OffersFilters,
    offset: number = 0,
    limit: number = 10,
  ): Promise<[Offer[], number]> {
    const [offers, count] = await this.persistenceService.getOffers(
      OffersFiltersForDb.formInputFilters(filters),
      offset,
      limit,
    );
    return [offers.map((o) => Offer.fromEntity(o)), count];
  }

  async getOfferById(id: number): Promise<OfferEntity> {
    return await this.persistenceService.getOfferById(id);
  }

  async getOfferByIdAndMarketplace(
    id: number,
    marketplaceKey: string,
  ): Promise<OfferEntity> {
    return await this.persistenceService.getOfferByIdAndMarketplace(
      id,
      marketplaceKey,
    );
  }

  async saveOffer(offer: OfferEntity): Promise<OfferEntity> {
    return await this.persistenceService.saveOffer(offer);
  }
}
