import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CollectionAsset {
  @Field(() => [CollectionAssetModel], { nullable: 'itemsAndList' })
  assets: CollectionAssetModel[];
  @Field(() => String, { nullable: true })
  totalCount: string;

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
}
