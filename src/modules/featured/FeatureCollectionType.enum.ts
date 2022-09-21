import { registerEnumType } from '@nestjs/graphql';

export enum FeaturedCollectionTypeEnum {
  Featured = 'Featured',
  Hero = 'Hero',
}

registerEnumType(FeaturedCollectionTypeEnum, {
  name: 'FeaturedCollectionTypeEnum',
});
