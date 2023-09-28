import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import { NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX, NUMERIC_ERROR, NUMERIC_RGX } from 'src/utils/constants';

@InputType()
export class CreateOfferArgs {
  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
  })
  @Field()
  identifier: string;

  @Matches(RegExp(NUMERIC_RGX), { message: `Quantity ${NUMERIC_ERROR}` })
  @Field(() => String)
  quantity: string = '1';

  @IsOptional()
  @Matches(RegExp(NUMERIC_RGX), { message: `Deadline ${NUMERIC_ERROR}` })
  @Field()
  deadline: string;

  @Field()
  paymentToken: string;

  @Field(() => Int)
  paymentTokenNonce: number = 0;

  @Field()
  paymentAmount: string;

  @Field(() => Int, { nullable: true })
  auctionId: number;

  @Field()
  marketplaceKey: string;
}
