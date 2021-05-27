import { registerEnumType } from '@nestjs/graphql';

export enum AuctionStatusEnum {
  active = 'active',
  closed = 'closed',
  ended = 'ended',
}

registerEnumType(AuctionStatusEnum, {
  name: 'AuctionStatusEnum',
});
