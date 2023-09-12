import { Injectable, Logger } from '@nestjs/common';
import { MxApiService } from 'src/common';
import '../../utils/extensions';
import { Asset, NftTypeEnum } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

import { Constants } from '@multiversx/sdk-nestjs-common';
import { LocalRedisCacheService } from 'src/common/services/caching/local-redis-cache.service';

@Injectable()
export class AssetByIdentifierService {
  constructor(private apiService: MxApiService, private readonly logger: Logger, private localRedisCacheService: LocalRedisCacheService) {}

  public async getAsset(identifier: string): Promise<Asset> {
    try {
      const cacheKey = this.getAssetsCacheKey(identifier);
      const getAsset = () => this.getMappedAssetByIdentifier(identifier);
      const asset = await this.localRedisCacheService.getOrSetWithDifferentTtl(cacheKey, getAsset);
      return asset?.value ? asset?.value : null;
    } catch (error) {
      this.logger.error('An error occurred while get asset by identifier', {
        path: 'AssetsService.getAsset',
        identifier,
        exception: error,
      });
    }
  }

  async getMappedAssetByIdentifier(identifier: string): Promise<{ key: string; value: Asset; ttl: number }> {
    const nft = await this.apiService.getNftByIdentifierForQuery(identifier);
    if (nft && !NftTypeEnum[nft?.type])
      return {
        key: identifier,
        value: undefined,
        ttl: Constants.oneDay(),
      };
    let ttl = Constants.oneDay();
    if (!nft) {
      ttl = 3 * Constants.oneSecond();
    }
    if ((nft?.media && nft?.media[0].thumbnailUrl.includes('default')) || (nft?.type === NftTypeEnum.NonFungibleESDT && !nft?.owner))
      ttl = Constants.oneMinute();
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
