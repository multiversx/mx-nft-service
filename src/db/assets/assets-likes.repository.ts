import { EntityRepository, Repository } from "typeorm";
import { AssetLikeEntity } from "./assets-likes.entity";


@EntityRepository(AssetLikeEntity)
export class AssetsLikesRepository extends Repository<AssetLikeEntity> {

  getAssetLikesCount(token: string,
    nonce: number): Promise<number> {
    return this.count({
      where: {
        token,
        nonce
      }
    });
  }

  async isAssetLiked(token: string,
    nonce: number,
    address: string): Promise<boolean> {

    const count = await this.count({
      where: {
        token,
        nonce,
        address
      }
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

  removeLike(token: string,
    nonce: number,
    address: string): Promise<any> {
    return this.delete({
      token,
      nonce,
      address
    });
  }
}