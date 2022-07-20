import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContractInfo {
  @Field(() => ID)
  address: string;
  @Field()
  marketplaceCutPercentage: string;
  @Field()
  isPaused: boolean;
  constructor(init?: Partial<ContractInfo>) {
    Object.assign(this, init);
  }
}
