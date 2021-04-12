import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from './account.dto';

@ObjectType()
export class Onwer {
  @Field(() => ID)
  account: Account;
  @Field(() => Date)
  startDate: Date;
  @Field(() => Date)
  endDate: Date;
}
