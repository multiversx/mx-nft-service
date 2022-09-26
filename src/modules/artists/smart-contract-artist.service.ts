import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ElrondApiService } from 'src/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { cacheConfig } from 'src/config';
import { XOXNO_MINTING_MANAGER } from 'src/utils/constants';

@Injectable()
export class SmartContractArtistsService {
  private redisClient: Redis.Redis;
  constructor(
    private cachingService: CachingService,
    private elrondApi: ElrondApiService,
  ) {
    this.redisClient = this.cachingService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getOrSetArtistForScAddress(address: string) {
    return this.cachingService.getOrSetCache(
      this.redisClient,
      CacheInfo.XoxnoScCount.key,
      async () => this.getArtistForScAddress(address),
      CacheInfo.XoxnoScCount.ttl,
    );
  }

  public async getArtistForScAddress(
    scAddress: string,
  ): Promise<{ address: string; owner: string }> {
    const account = await this.elrondApi.getSmartContractOwner(scAddress);
    if (account.owner === XOXNO_MINTING_MANAGER) {
      return await this.getXoxnoMinterOwner(scAddress);
    }
    return account;
  }

  private async getXoxnoMinterOwner(
    scAddress: string,
  ): Promise<{ address: string; owner: string }> {
    const xoxnoScCount = await this.getOrSetXoxnoScCount(XOXNO_MINTING_MANAGER);
    const smartContracts = await this.elrondApi.getAccountSmartContracts(
      XOXNO_MINTING_MANAGER,
      xoxnoScCount,
    );

    const selectedContract = smartContracts.find(
      (c) => c.address === scAddress,
    );
    const transaction = await this.elrondApi.getTransactionByHash(
      selectedContract.deployTxHash,
    );
    return {
      address: scAddress,
      owner: transaction.sender.bech32(),
    };
  }

  private async getOrSetXoxnoScCount(address: string) {
    return this.cachingService.getOrSetCache(
      this.redisClient,
      CacheInfo.XoxnoScCount.key,
      async () => this.elrondApi.getAccountSmartContractsCount(address),
      CacheInfo.XoxnoScCount.ttl,
    );
  }
}
