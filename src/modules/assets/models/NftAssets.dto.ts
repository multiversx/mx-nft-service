import { Field, ObjectType } from '@nestjs/graphql';
import { CollectionAssetApi, CollectionAssetSocialApi } from 'src/common';

@ObjectType()
export class NftSocial {
  @Field(() => String, { nullable: true })
  email: string;
  @Field(() => String, { nullable: true })
  blog: string;
  @Field(() => String, { nullable: true })
  twiter: string;

  constructor(init?: Partial<NftSocial>) {
    Object.assign(this, init);
  }

  static fromCollectionAssetSocialApi(social: CollectionAssetSocialApi) {
    return social
      ? new NftSocial({
          email: social.email,
          blog: social.blog,
          twiter: social.twiter,
        })
      : null;
  }
}

@ObjectType()
export class NftAssets {
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
  @Field(() => NftSocial, { nullable: true })
  social: NftSocial;

  constructor(init?: Partial<NftAssets>) {
    Object.assign(this, init);
  }

  static fromNftAssets(assets: CollectionAssetApi) {
    return assets
      ? new NftAssets({
          website: assets.website,
          description: assets.description,
          status: assets.status,
          pngUrl: assets.pngUrl,
          svgUrl: assets.svgUrl,
          social: NftSocial.fromCollectionAssetSocialApi(assets.social),
        })
      : null;
  }
}
