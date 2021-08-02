import { registerEnumType } from '@nestjs/graphql';

export enum AuctionStatusEnum {
  None = 'None',
  Running = 'Running',
  Closed = 'Closed',
  Ended = 'Ended',
}
registerEnumType(AuctionStatusEnum, {
  name: 'AuctionStatusEnum',
});
