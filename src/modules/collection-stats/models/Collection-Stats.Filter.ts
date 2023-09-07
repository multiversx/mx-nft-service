import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class CollectionStatsFilter {
  @Field(() => String)
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  identifier: string;
  @Field(() => String, { nullable: true })
  marketplaceKey: string;

  @Field(() => String, { nullable: true })
  paymentToken: string;

  constructor(init?: Partial<CollectionStatsFilter>) {
    Object.assign(this, init);
  }
}
