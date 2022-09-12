import { registerEnumType } from '@nestjs/graphql';

export enum AuctionTypeEnum {
  None = 'None',
  Nft = 'Nft',
  NftBid = 'NftBid',
  SftAll = 'SftAll',
  SftOnePerPayment = 'SftOnePerPayment',
}

registerEnumType(AuctionTypeEnum, {
  name: 'AuctionTypeEnum',
});
