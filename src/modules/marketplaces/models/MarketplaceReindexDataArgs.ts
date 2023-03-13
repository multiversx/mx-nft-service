import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class MarketplaceReindexDataArgs {
  @Field(() => String)
  marketplaceAddress: string;

  @Field(() => Number, { nullable: true })
  beforeTimestamp: number;

  @Field(() => Number, { nullable: true })
  afterTimestamp: number;
}
