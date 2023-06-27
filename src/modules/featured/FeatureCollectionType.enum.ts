import { registerEnumType } from '@nestjs/graphql';

export enum FeaturedCollectionTypeEnum {
  Featured = 'Featured',
  Hero = 'Hero',
  Tickets = 'Tickets',
}

registerEnumType(FeaturedCollectionTypeEnum, {
  name: 'FeaturedCollectionTypeEnum',
});
