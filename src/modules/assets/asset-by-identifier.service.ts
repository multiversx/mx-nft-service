import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import '../../utils/extensions';
import { Asset, NftTypeEnum } from './models';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class AssetByIdentifierService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  public async getAsset(identifier: string): Promise<Asset> {
    try {
      const cacheKey = this.getAssetsCacheKey(identifier);
      const getAsset = () => this.getMappedAssetByIdentifier(identifier);
      const asset = await this.redisCacheService.getOrSetWithDifferentTtl(
        this.redisClient,
        cacheKey,
        getAsset,
      );
      return asset?.value ? asset?.value : null;
    } catch (error) {
      this.logger.error('An error occurred while get asset by identifier', {
        path: 'AssetsService.getAsset',
        identifier,
        exception: error,
      });
    }
  }

  async getMappedAssetByIdentifier(
    identifier: string,
  ): Promise<{ key: string; value: Asset; ttl: number }> {
    const nft = await this.apiService.getNftByIdentifierForQuery(identifier);
    let ttl = TimeConstants.oneDay;
    if (!nft) {
      ttl = 3 * TimeConstants.oneSecond;
    }
    if (
      (nft?.media && nft?.media[0].thumbnailUrl.includes('default')) ||
      (nft?.type === NftTypeEnum.NonFungibleESDT && !nft?.owner)
    )
      ttl = TimeConstants.oneMinute;
    return {
      key: identifier,
      value: Asset.fromNft(nft),
      ttl: ttl,
    };
  }

  async getAssetsForIdentifiers(identifiers: string[]): Promise<Asset[]> {
    const nfts = await this.apiService.getNftsByIdentifiers(identifiers);
    return nfts?.map((nft) => Asset.fromNft(nft));
  }

  private getAssetsCacheKey(identifier: string) {
    return generateCacheKeyFromParams('asset', identifier);
  }
}
