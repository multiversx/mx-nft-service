import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from '../../accounts/models';

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
