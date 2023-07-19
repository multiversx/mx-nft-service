import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { CachingService } from '@multiversx/sdk-nestjs';
import { CollectionType } from '../assets/models/Collection.type';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { MinterEntity } from 'src/db/minters';

@Injectable()
export class MintersCachingService {
  constructor(private cacheService: CachingService) {}

  public async getMinters(getMinters: () => any): Promise<MinterEntity[]> {
    return await this.cacheService.getOrSetCache(
      CacheInfo.Minters.key,
      () => getMinters(),
      CacheInfo.Minters.ttl,
    );
  }

  public async invalidateMinters() {
    await this.cacheService.deleteInCache(CacheInfo.AllMarketplaces.key);
  }
}
