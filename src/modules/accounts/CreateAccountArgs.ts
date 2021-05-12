import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAccountArgs {
  @Field(() => String!)
  address: string;
  @Field(() => String!)
  profileImgUrl: string;
  @Field(() => String)
  herotag: string;
}
