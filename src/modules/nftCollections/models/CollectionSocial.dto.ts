import { ObjectType, Field } from '@nestjs/graphql';
import { CollectionAssetSocialApi } from 'src/common';

@ObjectType()
export class CollectionSocial {
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  blog: string;
  @Field({ nullable: true })
  twiter: string;
  constructor(init?: Partial<CollectionSocial>) {
    Object.assign(this, init);
  }

  static fromSocialApi(social: CollectionAssetSocialApi) {
    return !social
      ? null
      : new CollectionSocial({
          blog: social.blog,
          email: social.email,
          twiter: social.twiter,
        });
  }
}
