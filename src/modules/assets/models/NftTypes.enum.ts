import { registerEnumType } from '@nestjs/graphql';

export enum NftTypeEnum {
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
}

registerEnumType(NftTypeEnum, {
  name: 'NftTypeEnum',
});
