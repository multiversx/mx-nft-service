import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class MarketplaceEventsIndexingArgs {
  @Field(() => String)
  marketplaceAddress: string;

  @Field(() => Number, { nullable: true })
  beforeTimestamp: number;

  @Field(() => Number, { nullable: true })
  afterTimestamp: number;

  @Field(() => Boolean, { nullable: true })
  stopIfDuplicates: boolean;

  @Field(() => Number, { nullable: true })
  marketplaceLastIndexTimestamp: number;
}
