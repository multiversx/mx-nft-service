import { Field, InputType } from '@nestjs/graphql';
import { FeaturedCollectionTypeEnum } from './FeatureCollectionType.enum';

@InputType()
export class FeaturedCollectionsArgs {
  @Field(() => String)
  collection: string;

  @Field(() => FeaturedCollectionTypeEnum)
  type: FeaturedCollectionTypeEnum;
}
