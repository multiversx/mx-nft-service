import { EntityRepository, Repository } from 'typeorm';
import { ArtistAssetsInfo } from './artist-asset-info';
import { AssetLikeEntity } from '../assets/assets-likes.entity';

@EntityRepository(ArtistAssetsInfo)
export class ArtistAssetsInfoRepository extends Repository<ArtistAssetsInfo> {
  getAssetLikesCount(identifier: string): Promise<number> {
    return this.count({
      where: {
        identifier,
      },
    });
  }

  async isAssetLiked(identifier: string, address: string): Promise<boolean> {
    const count = await this.count({
      where: {
        identifier,
        address,
      },
    });

    return count > 0;
  }

  async addLike(assetLikeEntity: AssetLikeEntity): Promise<AssetLikeEntity> {
    try {
      return await this.save(assetLikeEntity);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === 1062) {
        return null;
      }
      throw err;
    }
  }
}
