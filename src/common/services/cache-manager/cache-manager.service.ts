import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { NetworkStatus } from '@elrondnetwork/erdjs/out/networkStatus';
import { cacheConfig } from 'config';

const Keys = {
  allContractAddresses: () => 'allContractAddresses',
  networkConfig: () => 'networkConfig',
  networkStatus: () => 'networkStatus',
};

@Injectable()
export class CacheManagerService {
  constructor(@Inject(CACHE_MANAGER) protected readonly cacheManager: Cache) {}

  /**
   * getAllContractAddresses
   * @param addresses
   */
  async setAllContractAddresses(addresses: Record<string, any>): Promise<void> {
    await this.set(
      Keys.allContractAddresses(),
      addresses,
      cacheConfig.getAllContractAddresses,
    );
  }
  async getAllContractAddresses(): Promise<Record<string, any>> {
    return this.cacheManager.get(Keys.allContractAddresses());
  }

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
