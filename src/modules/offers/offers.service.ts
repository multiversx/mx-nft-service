import { Injectable } from '@nestjs/common';
import '../../utils/extensions';

import { PersistenceService } from 'src/common/persistence/persistence.service';
import { OfferEntity } from 'src/db/offers';

@Injectable()
export class OffersService {
  constructor(private persistenceService: PersistenceService) {}

  async getOfferById(id: number): Promise<OfferEntity> {
    return await this.persistenceService.getOfferById(id);
  }

  async saveOffer(offer: OfferEntity): Promise<OfferEntity> {
    return await this.persistenceService.saveOffer(offer);
  }
}
