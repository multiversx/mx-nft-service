import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class ReportNftInput {
  @Field(() => String)
  identifier: string;
}
