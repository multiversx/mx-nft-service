import { Field, InputType } from '@nestjs/graphql';
import { AuctionStatusEnum } from './Auction-status.enum';

@InputType()
export class UpdateAuctionArgs {
  @Field(() => Number)
  id: number;
  @Field(() => AuctionStatusEnum)
  status: AuctionStatusEnum;
}
