import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContractInfo {
  @Field(() => ID, { nullable: true })
  address: string;
  @Field({ nullable: true })
  marketplaceCutPercentage: string;
  @Field({ nullable: true })
  isPaused: boolean;
  constructor(init?: Partial<ContractInfo>) {
    Object.assign(this, init);
  }
}
