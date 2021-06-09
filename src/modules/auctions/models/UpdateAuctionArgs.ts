import { Field, InputType, Int } from '@nestjs/graphql';
import { AuctionStatusEnum } from './AuctionStatus.enum';

@InputType()
export class UpdateAuctionArgs {
  @Field(() => Int)
  id: number;
  @Field(() => AuctionStatusEnum)
  status: AuctionStatusEnum;
}
