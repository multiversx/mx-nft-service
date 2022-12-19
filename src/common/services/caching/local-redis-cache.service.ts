import { RedisCacheService } from '@elrondnetwork/erdnest';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import Redis from 'ioredis';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { generateCacheKey } from 'src/utils/generate-cache-key';
import { promisify } from 'util';
export const REDIS_CLIENT_TOKEN = 'REDIS_CLIENT_TOKEN';
@Injectable()
export class LocalRedisCacheService {
  constructor(
    private readonly logger: Logger,
    private readonly redisCacheService: RedisCacheService,
    @Inject('REDIS_CLIENT_TOKEN') private readonly redis: Redis,
  ) {}

  async delByPattern(key: string, region: string = null): Promise<void> {
    const cacheKey = generateCacheKey(key, region);
    let profiler = new PerformanceProfiler();
    try {
      const stream = this.redis.scanStream({
        match: `${cacheKey}*`,
        count: 100,
      });
      let keys = [];
      stream.on('data', async function (resultKeys) {
        for (var i = 0; i < resultKeys.length; i++) {
          keys.push(resultKeys[i]);
        }
        const dels = keys.map((key) => ['del', key]);

        const multi = this.redis.multi(dels);
        await promisify(multi.exec).call(multi);
      });

      stream.on('end', function () {
        console.log('final batch delete complete');
      });
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to delete from redis cache by pattern.',
        {
          path: 'redis-cache.service.delByPattern',
          exception: err,
          cacheKey: cacheKey,
        },
      );
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('MDEL', profiler.duration);
    }
  }

  async getOrSetWithDifferentTtl(
    key: string,
    createValueFunc: () => any,
  ): Promise<any> {
    const cachedData = await this.redisCacheService.get(key);
    if (!isNil(cachedData)) {
      return cachedData;
    }
    const value = await this.buildInternalCreateValueFunc(key, createValueFunc);
    await this.redisCacheService.set(key, value, value.ttl);

    return value;
  }

  private async buildInternalCreateValueFunc(
    key: string,
    createValueFunc: () => any,
  ): Promise<any> {
    try {
      let data = createValueFunc();
      if (data instanceof Promise) {
        data = await data;
      }
      return data;
    } catch (err) {
      this.logger.error(`An error occurred while trying to load value.`, {
        path: 'redis-cache.service.createValueFunc',
        exception: err,
        key,
      });
      return null;
    }
  }
}
