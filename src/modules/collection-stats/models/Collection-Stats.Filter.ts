import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CollectionStatsFilter {
  @Field(() => String)
  identifier: string;
  constructor(init?: Partial<CollectionStatsFilter>) {
    Object.assign(this, init);
  }
}
