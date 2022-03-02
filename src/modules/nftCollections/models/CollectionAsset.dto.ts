import { ObjectType, Field } from '@nestjs/graphql';
import { Nft } from 'src/common/services/elrond-communication/models/nft.dto';

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

  static fromNft(nft: Nft) {
    return nft
      ? new CollectionAssetModel({
          thumbnailUrl:
            nft.media?.length > 0 ? nft.media[0].thumbnailUrl : null,
          identifier: nft.identifier,
        })
      : null;
  }
}
