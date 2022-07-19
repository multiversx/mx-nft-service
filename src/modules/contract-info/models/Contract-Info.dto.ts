import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContractInfo {
  @Field()
  marketplaceCutPercentage: string;
  @Field()
  isPaused: boolean;
  constructor(init?: Partial<ContractInfo>) {
    Object.assign(this, init);
  }
}
