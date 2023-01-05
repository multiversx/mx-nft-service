import { Repository } from 'typeorm';
import { OfferEntity } from '.';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersFiltersForDb } from './offers.filter';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from 'src/modules/rabbitmq/cache-invalidation/events/changed.event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class OffersRepository extends Repository<OfferEntity> {
  constructor(
    private cacheEventsPublisherService: CacheEventsPublisherService,
    @InjectRepository(OfferEntity)
    private offersRepository: Repository<OfferEntity>,
  ) {
    super();
  }

  async getActiveOffers(
    filters?: OffersFiltersForDb,
    offset: number = 0,
    limit: number = 10,
  ): Promise<[OfferEntity[], number]> {
    return await this.offersRepository
      .createQueryBuilder('offers')
      .where(this.getOffersFilterForSingleValues(filters))
      .andWhere(`${this.getOffersFilterForArrayValues(filters)}`)
      .offset(offset)
      .limit(limit)
      .getManyAndCount();
  }

  async getOfferById(id: number): Promise<OfferEntity> {
    return await this.offersRepository.findOne({
      where: [{ id: id }],
    });
  }

  async getOffersThatReachedDeadline(): Promise<OfferEntity[]> {
    return await this.offersRepository
      .createQueryBuilder('a')
      .where({ status: OfferStatusEnum.Active })
      .andWhere(
        `a.endDate > 0 AND a.endDate <= ${DateUtils.getCurrentTimestamp()}`,
      )
      .limit(1000)
      .getMany();
  }

  async getOfferByIdAndMarketplaceKey(
    marketplaceOfferId: number,
    marketplaceKey: string,
  ): Promise<OfferEntity> {
    return await this.offersRepository.findOne({
      where: [
        {
          marketplaceOfferId: marketplaceOfferId,
          marketplaceKey: marketplaceKey,
        },
      ],
    });
  }

  async saveOffer(offer: OfferEntity) {
    await this.triggerCacheInvalidation(offer.collection, offer.ownerAddress);
    return await this.offersRepository.save(offer);
  }

  async updateOfferWithStatus(offer: OfferEntity, status: OfferStatusEnum) {
    offer.status = status;
    offer.modifiedDate = new Date(new Date().toUTCString());

    await this.triggerCacheInvalidation(offer.collection, offer.ownerAddress);
    return await this.offersRepository.save(offer);
  }

  async updateOffers(offers: OfferEntity[]) {
    await this.triggerCacheInvalidationForOffers(offers);
    return await this.offersRepository.save(offers);
  }

  async rollbackOffersByHash(blockHash: string) {
    const offersByHash = await this.getOffersByBlockHash(blockHash);
    if (!offersByHash || offersByHash.length === 0) {
      return true;
    }
    for (let order of offersByHash) {
      const [offers, count] = await this.getActiveOffers(
        new OffersFiltersForDb({ identifier: order.identifier }),
      );
      if (count === 1) {
        return this.offersRepository.delete(offers[0].id);
      }
      const indexOf = offers.findIndex((o) => o.id === order.id);
      if (indexOf === count - 1) {
        await this.offersRepository.delete(offers[indexOf].id);
        await this.updateOfferWithStatus(
          offers[indexOf - 1],
          OfferStatusEnum.Active,
        );
      } else {
        await this.offersRepository.delete(offers[indexOf].id);
      }
    }
  }

  private async triggerCacheInvalidation(
    identifier: string,
    ownerAddress: string,
  ) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: identifier,
        type: CacheEventTypeEnum.UpdateOffer,
        address: ownerAddress,
      }),
    );
  }

  private async triggerCacheInvalidationForOffers(offers: OfferEntity[]) {
    for (const offer of offers) {
      await this.triggerCacheInvalidation(offer.collection, offer.ownerAddress);
    }
  }

  private getOffersFilterForSingleValues(filters?: OffersFiltersForDb) {
    const filterBuilder = new FilterBuilder();
    for (const key of Object.keys(filters)) {
      filterBuilder.addFilter(key, filters[key]);
    }
    return [filterBuilder.build()];
  }

  private getOffersFilterForArrayValues(filters?: OffersFiltersForDb) {
    const filterBuilder = new InFilterBuilder();
    for (const key of Object.keys(filters)) {
      filterBuilder.addFilter(key, filters[key]);
    }
    return [filterBuilder.build()];
  }

  private getOffersByBlockHash(blockHash: string): Promise<OfferEntity[]> {
    return this.offersRepository
      .createQueryBuilder()
      .where({ blockHash: blockHash })
      .getMany();
  }
}

export class FilterBuilder {
  private queryFilter = {};

  addFilter(filterName: string, filterValue): this {
    if (filterValue && !Array.isArray(filterValue)) {
      this.queryFilter[filterName] = filterValue;
    }

    return this;
  }

  build(): {} {
    return this.queryFilter;
  }
}

export class InFilterBuilder {
  private queryFilter = '';

  addFilter(filterName: string, filterValue): this {
    if (filterValue && Array.isArray(filterValue)) {
      this.queryFilter =
        this.queryFilter === ''
          ? `${filterName} IN(${filterValue.map((value) => `'${value}'`)})`
          : `${filterName} AND ${filterName} IN(${filterValue.map(
              (value) => `'${value}'`,
            )})`;
    }

    return this;
  }

  build(): {} {
    return this.queryFilter === '' ? '1=1' : this.queryFilter;
  }
}
