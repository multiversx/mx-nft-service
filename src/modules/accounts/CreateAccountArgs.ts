import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAccountArgs {
  @Field()
  address: string;
  @Field({ nullable: true })
  herotag: string;
  @Field({ nullable: true })
  description: string;
  @Field(() => [Int], { nullable: true })
  socialLinkIds: number[];
}
