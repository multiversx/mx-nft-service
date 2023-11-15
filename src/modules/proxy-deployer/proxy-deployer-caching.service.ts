import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { MinterEntity } from 'src/db/minters';

@Injectable()
export class MintersCachingService {
  constructor(private redisCacheService: RedisCacheService) {}

  public async getMinters(getMinters: () => any): Promise<MinterEntity[]> {
    return await this.redisCacheService.getOrSet(CacheInfo.Minters.key, () => getMinters(), CacheInfo.Minters.ttl);
  }

  public async invalidateMinters() {
    await this.redisCacheService.delete(CacheInfo.Minters.key);
  }
}
