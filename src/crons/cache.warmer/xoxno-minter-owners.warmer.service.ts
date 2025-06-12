import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants, Locker } from '@multiversx/sdk-nestjs-common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

import { MxApiService } from 'src/common';
import { XOXNO_MINTING_MANAGER } from 'src/utils/constants';

@Injectable()
export class XoxnoArtistsWarmerService {
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private mxApiService: MxApiService,
    private cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleArtistMappingForXoxno() {
    await Locker.lock(
      'Xoxno Minter invalidations',
      async () => {
        const scOwners = await this.getActualOwnerForXoxno(XOXNO_MINTING_MANAGER);
        scOwners?.map(
          async (scOwner) =>
            await this.invalidateKey(
              `${CacheInfo.Artist.key}_${scOwner.address}`,
              { key: scOwner.address, value: scOwner },
              5 * Constants.oneHour(),
            ),
        );
      },
      true,
    );
  }

  private async getActualOwnerForXoxno(address: string) {
    const cachedScCount = await this.getCachedXoxnoScCount();
    const smartContractsCount = await this.getOrSetXoxnoScCount(address);
    if (cachedScCount || cachedScCount === smartContractsCount) return;
    const smartContracts = await this.mxApiService.getAccountSmartContracts(address, smartContractsCount);

    const response = [];
    for (const contract of smartContracts) {
      const cachedArtist = await this.getArtistAddress(contract.address);
      if (cachedArtist) continue;
      const transaction = await this.mxApiService.getTransactionByHash(contract.deployTxHash);
      response.push({
        address: contract.address,
        owner: transaction.sender.toBech32(),
      });
    }

    return response;
  }

  private async getOrSetXoxnoScCount(address: string) {
    return this.cacheService.getOrSet(
      CacheInfo.XoxnoScCount.key,
      async () => this.mxApiService.getAccountSmartContractsCount(address),
      CacheInfo.XoxnoScCount.ttl,
    );
  }

  private async getArtistAddress(address: string) {
    return this.cacheService.get(`${CacheInfo.Artist.key}_${address}`);
  }

  private async getCachedXoxnoScCount() {
    return this.cacheService.get(CacheInfo.XoxnoScCount.key);
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
