import { Field, ID, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@nestjs-query/query-graphql';

@ObjectType()
export class Price {
  @FilterableField(() => ID)
  tokenIdentifier: string;
  @FilterableField(() => String)
  amount: string;
  @FilterableField(() => String)
  nonce: string;
}
