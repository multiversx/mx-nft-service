import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { MxApiService } from 'src/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { cacheConfig } from 'src/config';
import { XOXNO_MINTING_MANAGER } from 'src/utils/constants';

@Injectable()
export class SmartContractArtistsService {
  private redisClient: Redis.Redis;
  constructor(
    private cachingService: CachingService,
    private mxApiService: MxApiService,
  ) {
    this.redisClient = this.cachingService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getOrSetArtistForScAddress(address: string) {
    return this.cachingService.getOrSetCache(
      this.redisClient,
      `${CacheInfo.Artist.key}_${address}`,
      async () => this.getMappedArtistForScAddress(address),
      CacheInfo.Artist.ttl,
    );
  }

  public async getMappedArtistForScAddress(
    scAddress: string,
  ): Promise<{ key: string; value: { address: string; owner: string } }> {
    const account = await this.getArtistForScAddress(scAddress);

    return { key: account.address, value: account };
  }

  public async getArtistForScAddress(
    scAddress: string,
  ): Promise<{ address: string; owner: string }> {
    const account = await this.mxApiService.getSmartContractOwner(scAddress);
    if (account.owner === XOXNO_MINTING_MANAGER) {
      return await this.getXoxnoMinterOwner(scAddress);
    }
    return account;
  }

  private async getXoxnoMinterOwner(
    scAddress: string,
  ): Promise<{ address: string; owner: string }> {
    const xoxnoScCount = await this.getOrSetXoxnoScCount(XOXNO_MINTING_MANAGER);
    const smartContracts = await this.mxApiService.getAccountSmartContracts(
      XOXNO_MINTING_MANAGER,
      xoxnoScCount,
    );

    const selectedContract = smartContracts.find(
      (c) => c.address === scAddress,
    );
    const transaction = await this.mxApiService.getTransactionByHash(
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
      async () => this.mxApiService.getAccountSmartContractsCount(address),
      CacheInfo.XoxnoScCount.ttl,
    );
  }
}
