import { Field, ObjectType } from '@nestjs/graphql';
import { CollectionAssetApi, CollectionAssetSocialApi } from 'src/common';

@ObjectType()
export class CollectionSocial {
  @Field(() => String, { nullable: true })
  email: string;
  @Field(() => String, { nullable: true })
  blog: string;
  @Field(() => String, { nullable: true })
  twiter: string;

  constructor(init?: Partial<CollectionSocial>) {
    Object.assign(this, init);
  }

  static fromCollectionAssetSocialApi(social: CollectionAssetSocialApi) {
    return social
      ? new CollectionSocial({
          email: social.email,
          blog: social.blog,
          twiter: social.twiter,
        })
      : null;
  }
}

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
          social: CollectionSocial.fromCollectionAssetSocialApi(assets.social),
        })
      : null;
  }
}
