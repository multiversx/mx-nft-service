import { registerEnumType } from '@nestjs/graphql';

export enum ArtistSortingEnum {
  MostFollowed = 'MostFollowed',
  Trending = 'Trending',
  MostActive = 'MostActive',
}

registerEnumType(ArtistSortingEnum, {
  name: 'ArtistSortingEnum',
});
