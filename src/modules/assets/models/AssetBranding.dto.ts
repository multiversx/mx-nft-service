import { Field, ObjectType } from '@nestjs/graphql';
import { CollectionAssetApi, CollectionAssetSocialApi } from 'src/common';

@ObjectType()
export class AssetSocial {
  @Field(() => String, { nullable: true })
  email: string;
  @Field(() => String, { nullable: true })
  blog: string;
  @Field(() => String, { nullable: true })
  twiter: string;

  constructor(init?: Partial<AssetSocial>) {
    Object.assign(this, init);
  }

  static fromCollectionAssetSocialApi(social: CollectionAssetSocialApi) {
    return social
      ? new AssetSocial({
          email: social.email,
          blog: social.blog,
          twiter: social.twiter,
        })
      : null;
  }
}

@ObjectType()
export class AssetBranding {
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
  @Field(() => AssetSocial, { nullable: true })
  social: AssetSocial;

  constructor(init?: Partial<AssetBranding>) {
    Object.assign(this, init);
  }

  static fromNftAssets(assets: CollectionAssetApi) {
    return assets
      ? new AssetBranding({
          website: assets.website,
          description: assets.description,
          status: assets.status,
          pngUrl: assets.pngUrl,
          svgUrl: assets.svgUrl,
          social: AssetSocial.fromCollectionAssetSocialApi(assets.social),
        })
      : null;
  }
}
