import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { AuctionStatusEnum } from './Auction-status.enum';

registerEnumType(AuctionStatusEnum, {
  name: 'AuctionStatusEnum',
});

@InputType()
export class UpdateAuctionArgs {
  @Field(() => Number)
  id: number;
  @Field(() => AuctionStatusEnum)
  status: AuctionStatusEnum;
}
