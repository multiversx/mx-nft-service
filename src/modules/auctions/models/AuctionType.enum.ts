import { registerEnumType } from '@nestjs/graphql';

export enum AuctionTypeEnum {
  None = 'None',
  Nft = 'Nft',
  SftAll = 'SftAll',
  SftOnePerPayment = 'SftOnePerPayment',
}

registerEnumType(AuctionTypeEnum, {
  name: 'AuctionTypeEnum',
});
