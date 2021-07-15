import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class PreviewNftUrlService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
    private s3Service: S3Service,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.assetsRedisClientName,
    );
  }

  async checkHasPreviewUrl(identifier: string): Promise<boolean> {
    try {
      const cacheKey = this.checkHasPreviewUrlCacheKey(identifier);
      const getArtistAssetInfo = () =>
        this.s3Service.checkFileExists(identifier);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getArtistAssetInfo,
        cacheConfig.assetsttl,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting the artist asset info.',
        {
          path: 'PreviewNftUrlService.checkHasPreviewUrl',
          identifier,
        },
      );
    }
  }

  async addPreviewImageToS3(identifier: string, file: any): Promise<boolean> {
    try {
      await this.invalidatePreviewUrl(identifier);
      const finishUpload = await this.s3Service.upload(file, identifier);
      return finishUpload;
    } catch (err) {
      this.logger.error('An error occurred while adding Preview Image to S3.', {
        path: 'PreviewNftUrlService.addPreviewImageToS3',
        identifier,
        err,
      });
      return false;
    }
  }

  private checkHasPreviewUrlCacheKey(identifier: string) {
    return generateCacheKeyFromParams('hasPreviewUrl', identifier);
  }

  private invalidatePreviewUrl(identifier: string): Promise<void> {
    const cacheKey = this.checkHasPreviewUrlCacheKey(identifier);
    return this.redisCacheService.del(this.redisClient, cacheKey);
  }
}
