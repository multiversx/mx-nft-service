import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { NetworkStatus } from '@elrondnetwork/erdjs/out/networkStatus';

const Keys = {
  networkConfig: () => 'networkConfig',
  networkStatus: () => 'networkStatus',
};

@Injectable()
export class CacheManagerService {
  constructor(@Inject(CACHE_MANAGER) protected readonly cacheManager: Cache) {}

  async getNetworkStatus(): Promise<NetworkStatus> {
    return this.cacheManager.get(Keys.networkStatus());
  }

  private async set(key: string, value: any, ttl: number) {
    if (!value) {
      return;
    }

    if (ttl <= -1) {
      return this.cacheManager.set(key, value);
    } else {
      return this.cacheManager.set(key, value, { ttl });
    }
  }
}
