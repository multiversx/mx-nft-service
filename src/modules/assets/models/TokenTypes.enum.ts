import { registerEnumType } from '@nestjs/graphql';

export enum TokenTypeEnum {
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
}

registerEnumType(TokenTypeEnum, {
  name: 'TokenTypeEnum',
});
