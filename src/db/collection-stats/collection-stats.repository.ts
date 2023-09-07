import { Injectable } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { EntityManager } from 'typeorm';
import { CollectionStatsEntity } from './collection-stats';
import { getCollectionStats } from './collection-stats.querries';

@Injectable()
export class CollectionStatsRepository {
  constructor(public readonly manager: EntityManager) {}
  async getStats(
    identifier: string,
    marketplaceKey: string = undefined,
    paymentToken: string = mxConfig.egld,
  ): Promise<CollectionStatsEntity> {
    const response = await this.manager.query(getCollectionStats(identifier, marketplaceKey, paymentToken));
    return response?.length > 0 ? response[0] : new CollectionStatsEntity();
  }

  async getFloorPriceForCollection(
    identifier: string,
    marketplaceKey: string = undefined,
    paymentToken: string = mxConfig.egld,
  ): Promise<number> {
    const response = await this.manager.query(getCollectionStats(identifier, marketplaceKey, paymentToken));
    return response?.length > 0 ? response[0]?.minPrice ?? 0 : 0;
  }
}
