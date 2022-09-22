import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Locker } from 'src/utils/locker';
import { ClientProxy } from '@nestjs/microservices';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { ElrondApiService } from 'src/common';
import { XOXNO_MINTING_MANAGER } from 'src/utils/constants';

@Injectable()
export class XoxnoArtistsWarmerService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private elrondApi: ElrondApiService,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleArtistMappingForXoxno() {
    await Locker.lock(
      'Xoxno Minter invalidations',
      async () => {
        const scOwners = await this.getActualOwnerForXoxno(
          XOXNO_MINTING_MANAGER,
        );
        scOwners?.map(
          async (scOwner) =>
            await this.invalidateKey(
              `${CacheInfo.ActualArtist.key}_${scOwner.address}`,
              scOwner,
              5 * TimeConstants.oneHour,
            ),
        );
      },
      true,
    );
  }

  private async getActualOwnerForXoxno(address: string) {
    const cachedScCount = await this.getXoxnoScCount(address);
    const smartContractsCount = await this.getXoxnoScCount(address);
    console.log({ cachedScCount, smartContractsCount });
    if (cachedScCount !== smartContractsCount) {
      const smartContracts = await this.elrondApi.getAccountSmartContracts(
        address,
        smartContractsCount,
      );

      const response = [];
      for (const contract of smartContracts) {
        const transaction = await this.elrondApi.getTransactionByHash(
          contract.deployTxHash,
        );
        response.push({
          address: contract.address,
          owner: transaction.sender.bech32(),
        });
      }

      return response;
    }
  }

  private async getXoxnoScCount(address: string) {
    return this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.XoxnoScCount.key,
      async () => this.elrondApi.getAccountSmartContractsCount(address),
      CacheInfo.XoxnoScCount.ttl,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.setCache(this.redisClient, key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    await this.clientProxy.emit<{
      redisClient: Redis.Redis;
      key: string;
      ttl: number;
    }>('refreshCacheKey', {
      redisClientName: cacheConfig.persistentRedisClientName,
      key,
      ttl,
    });
  }
}
