import { Inject, Injectable } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondIdentityService,
  RedisCacheService,
} from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SearchService {
  private redisClient: Redis.Redis;
  constructor(
    private accountsService: ElrondIdentityService,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getHerotags(searchTerm: string): Promise<any> {
    const response = await this.accountsService.getAcountsByHerotag(searchTerm);
    return response?.herotags;
  }

  async getCollections(searchTerm: string): Promise<any> {
    const response = await this.apiService.getCollectionsBySearch(searchTerm);
    return response?.map((c) => c.collection);
  }

  async getNfts(searchTerm: string): Promise<any> {
    const response = await this.apiService.getNftsBySearch(searchTerm);
    return response?.map((c) => c.identifier);
  }

  async getTags(searchTerm: string): Promise<any> {
    const response = await this.apiService.getTagsBySearch(searchTerm);
    return [response?.tag];
  }
}
