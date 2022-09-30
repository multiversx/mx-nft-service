import { registerEnumType } from '@nestjs/graphql';

export enum AssetsSortingEnum {
  MostLikes = 'MostFollowed',
}

registerEnumType(AssetsSortingEnum, {
  name: 'AssetsSortingEnum',
});
