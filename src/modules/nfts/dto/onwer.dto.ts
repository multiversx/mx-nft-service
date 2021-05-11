import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from './account.dto';

@ObjectType()
export class Onwer {
  @Field(() => Account, { nullable: true })
  account: Account | any;
  @Field(() => Date)
  startDate: Date;
  @Field(() => Date)
  endDate: Date;

  constructor(init?: Partial<Onwer>) {
    Object.assign(this, init);
  }
}
