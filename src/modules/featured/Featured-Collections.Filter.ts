import { Field, InputType } from '@nestjs/graphql';
import { FeaturedCollectionTypeEnum } from './FeatureCollectionType.enum';

@InputType()
export class FeaturedCollectionsFilter {
  @Field(() => FeaturedCollectionTypeEnum)
  type: FeaturedCollectionTypeEnum;
  constructor(init?: Partial<FeaturedCollectionsFilter>) {
    Object.assign(this, init);
  }
}
