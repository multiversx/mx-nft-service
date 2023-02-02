import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReportNft {
  @Field(() => String)
  identifier: string;

  @Field(() => Int)
  reportCount: number;

  constructor(init?: Partial<ReportNft>) {
    Object.assign(this, init);
  }
}
