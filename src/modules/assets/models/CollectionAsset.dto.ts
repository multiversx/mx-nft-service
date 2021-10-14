import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class CollectionAsset {
  @Field(() => [String], { nullable: 'itemsAndList' })
  thumbnailUrl: string[];
  @Field(() => String, { nullable: true })
  totalCount: string;

  constructor(init?: Partial<CollectionAsset>) {
    Object.assign(this, init);
  }
}
