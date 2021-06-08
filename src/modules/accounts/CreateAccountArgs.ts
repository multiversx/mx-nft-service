import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAccountArgs {
  @Field()
  address: string;
  @Field({ nullable: true })
  profileImgUrl: string;
  @Field({ nullable: true })
  herotag: string;
  @Field({ nullable: true })
  description: string;
}
