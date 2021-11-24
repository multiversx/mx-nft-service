import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { FeaturedNftsRepository } from 'src/db/featuredNfts';
import { Asset } from '../assets/models';

@Injectable()
export class FeaturedNftsService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private fearturedNftsRepo: FeaturedNftsRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.assetsRedisClientName,
    );
  }

  async getFeaturedNfts(
    limit: number = 10,
    offset: number,
  ): Promise<[Asset[], number]> {
    try {
      const cacheKey = this.getFeaturedNftsCacheKey(limit, offset);
      const getAssetLiked = () =>
        this.fearturedNftsRepo.getFeaturedNfts(limit, offset);
      const [featuredNfts, count] = await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAssetLiked,
        cacheConfig.assetsttl,
      );
      const nfts = await this.apiService.getNftsByIdentifiers(
        featuredNfts.map((x) => x.identifier),
      );
      return [nfts.map((nft) => Asset.fromNft(nft)), count];
    } catch (err) {
      this.logger.error('An error occurred while loading featured nfts.', {
        path: 'FeaturedNftsService.getFeaturedNfts',
        exception: err,
      });
    }
  }

  private getFeaturedNftsCacheKey(limit, offset) {
    return generateCacheKeyFromParams('featuredNfts', limit, offset);
  }
}
