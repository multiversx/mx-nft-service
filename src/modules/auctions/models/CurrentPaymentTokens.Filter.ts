import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class CurrentPaymentTokensFilters {
  @Field(() => String, { nullable: true })
  marketplaceKey: string;

  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String, { nullable: true })
  collectionIdentifier: string;
  constructor(init?: Partial<CurrentPaymentTokensFilters>) {
    Object.assign(this, init);
  }
}
