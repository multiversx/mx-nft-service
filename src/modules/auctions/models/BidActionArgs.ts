import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class BidActionArgs {
  @Field(() => Int)
  auctionId: number;

  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  price: string;
}

@InputType()
export class BuySftActionArgs {
  @Field(() => Int)
  auctionId: number;

  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  price: string;
  @Field(() => String, { nullable: true })
  quantity: string;
}
