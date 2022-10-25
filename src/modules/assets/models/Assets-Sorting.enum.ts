import { registerEnumType } from '@nestjs/graphql';

export enum AssetsSortingEnum {
  MostLikes = 'MostFollowed',
  RankAsc = 'RankAsc',
  RankDesc = 'RankDesc',
}

registerEnumType(AssetsSortingEnum, {
  name: 'AssetsSortingEnum',
});
