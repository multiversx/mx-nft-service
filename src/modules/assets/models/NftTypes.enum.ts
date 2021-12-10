import { registerEnumType } from '@nestjs/graphql';

export enum NftTypeEnum {
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
}

registerEnumType(NftTypeEnum, {
  name: 'NftTypeEnum',
});

export enum ScamInfoTypeEnum {
  potentialScam = 'potentialScam',
  scam = 'scam',
}

registerEnumType(ScamInfoTypeEnum, {
  name: 'ScamInfoTypeEnum',
});
