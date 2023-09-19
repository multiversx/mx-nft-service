import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';
import { MxApiService } from 'src/common';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class TokensWarmerService {
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private cacheService: CacheService,
    private mxApiService: MxApiService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateTokens() {
    await Locker.lock(
      'Tokens invalidations',
      async () => {
        const tokens = await this.mxApiService.getAllTokens();
        await this.invalidateKey(CacheInfo.AllTokens.key, tokens, CacheInfo.AllTokens.ttl);
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateDexTokens() {
    await Locker.lock(
      'DEX Tokens invalidations',
      async () => {
        const tokens = await this.mxApiService.getAllDexTokens();
        await this.invalidateKey(CacheInfo.AllDexTokens.key, tokens, CacheInfo.AllDexTokens.ttl);
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateEgldTokens() {
    await Locker.lock(
      'Egld Token invalidation',
      async () => {
        const tokens = await this.mxApiService.getEgldPriceFromEconomics();
        await this.invalidateKey(CacheInfo.EgldToken.key, tokens, CacheInfo.EgldToken.ttl);
      },
      true,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.set(key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    await this.clientProxy.emit<{
      key: string;
      ttl: number;
    }>('refreshCacheKey', {
      key,
      ttl,
    });
  }
}
