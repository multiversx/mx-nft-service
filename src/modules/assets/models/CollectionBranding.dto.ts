import { Field, ObjectType } from '@nestjs/graphql';
import { CollectionAssetApi, CollectionAssetSocialApi } from 'src/common';
import { CollectionSocial } from 'src/modules/nftCollections/models';

@ObjectType()
export class CollectionBranding {
  @Field(() => String, { nullable: true })
  website: string;
  @Field(() => String, { nullable: true })
  description: string;
  @Field(() => String, { nullable: true })
  status: string;
  @Field(() => String, { nullable: true })
  pngUrl: string;
  @Field(() => String, { nullable: true })
  svgUrl: string;
  @Field(() => CollectionSocial, { nullable: true })
  social: CollectionSocial;

  constructor(init?: Partial<CollectionBranding>) {
    Object.assign(this, init);
  }

  static fromNftAssets(assets: CollectionAssetApi) {
    return assets
      ? new CollectionBranding({
          website: assets.website,
          description: assets.description,
          status: assets.status,
          pngUrl: assets.pngUrl,
          svgUrl: assets.svgUrl,
          social: CollectionSocial.fromSocialApi(assets.social),
        })
      : null;
  }
}
