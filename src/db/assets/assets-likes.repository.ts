import { EntityRepository, Repository } from "typeorm";
import { AssetLikeEntity } from "./assets-likes.entity";


@EntityRepository(AssetLikeEntity)
export class AssetsLikesRepository extends Repository<AssetLikeEntity> {

  getAssetLikesCount(tokenIdentifier: string,
    tokenNonce: number): Promise<number> {
    return this.count({
      where: {
        tokenIdentifier,
        tokenNonce
      }
    });
  }

  async isAssetLiked(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<boolean> {

    const count = await this.count({
      where: {
        tokenIdentifier,
        tokenNonce,
        address
      }
    });

    return count > 0;
  }

  addLike(assetLikeEntity: AssetLikeEntity): Promise<AssetLikeEntity> {
    return this.save(assetLikeEntity);
  }

  removeLike(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<any> {
    return this.delete({
      tokenIdentifier,
      tokenNonce,
      address
    });
  }
}