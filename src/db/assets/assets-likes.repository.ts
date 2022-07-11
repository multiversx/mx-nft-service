import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { DeleteResult, EntityRepository, Repository } from 'typeorm';
import { AssetLikeEntity } from './assets-likes.entity';

@EntityRepository(AssetLikeEntity)
export class AssetsLikesRepository extends Repository<AssetLikeEntity> {
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

  async getAssetLikesCount(identifier: string): Promise<number> {
    return await this.count({
      where: {
        identifier,
      },
    });
  }

  async addLike(assetLikeEntity: AssetLikeEntity): Promise<AssetLikeEntity> {
    try {
      return await this.save(assetLikeEntity);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }

  async removeLike(identifier: string, address: string): Promise<DeleteResult> {
    return await this.delete({
      identifier,
      address,
    });
  }
}
