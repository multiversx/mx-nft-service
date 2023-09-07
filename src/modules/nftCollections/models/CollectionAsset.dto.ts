import { ObjectType, Field } from '@nestjs/graphql';
import { Nft } from 'src/common/services/mx-communication/models/nft.dto';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';

@ObjectType()
export class CollectionAsset {
  @Field(() => [CollectionAssetModel], { nullable: 'itemsAndList' })
  assets: CollectionAssetModel[];
  @Field(() => String, { nullable: true })
  totalCount: string;
  collectionIdentifer: string;

  constructor(init?: Partial<CollectionAsset>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class CollectionAssetModel {
  @Field(() => String, { nullable: true })
  thumbnailUrl: string;
  @Field(() => String)
  identifier: string;
  constructor(init?: Partial<CollectionAssetModel>) {
    Object.assign(this, init);
  }
  @Field(() => Boolean, { nullable: true })
  isNsfw?: boolean;
  @Field(() => ScamInfo, { nullable: true })
  scamInfo?: ScamInfo;

  static fromNft(nft: Nft) {
    return nft
      ? new CollectionAssetModel({
          thumbnailUrl: nft.media?.length > 0 ? nft.media[0].thumbnailUrl : null,
          identifier: nft.identifier,
          isNsfw: nft.isNsfw,
          scamInfo: ScamInfo.fromScamInfoApi(nft.scamInfo),
        })
      : null;
  }
}
