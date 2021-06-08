import { registerEnumType } from '@nestjs/graphql';

export enum AuctionStatusEnum {
  None = 'None',
  Running = 'Running',
  SftWaitingForBuyOrOwnerClaim = 'SftWaitingForBuyOrOwnerClaim',
  Closed = 'Closed',
  Ended = 'Ended',
}
registerEnumType(AuctionStatusEnum, {
  name: 'AuctionStatusEnum',
});
