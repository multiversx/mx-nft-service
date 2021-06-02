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
}