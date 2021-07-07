import { EntityRepository, Repository } from 'typeorm';
import { AssetLikeEntity } from './assets-likes.entity';

@EntityRepository(AssetLikeEntity)
export class AssetsLikesRepository extends Repository<AssetLikeEntity> {
  getAssetLikesCount(identifier: string): Promise<number> {
    return this.count({
      where: {
        identifier,
      },
    });
  }

  async getAssetsLiked(
    limit: number = 20,
    offset: number = 0,
    address: string,
  ): Promise<[AssetLikeEntity[], number]> {
    const assetsLiked = await this.createQueryBuilder('assetsLiked')
      .where({
        address: address,
      })
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return assetsLiked;
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

  removeLike(identifier: string, address: string): Promise<any> {
    return this.delete({
      identifier,
      address,
    });
  }
}
