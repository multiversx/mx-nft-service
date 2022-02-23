import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SocialLink {
  @Field(() => ID, { nullable: true })
  type: string;

  @Field({ nullable: true })
  url: string;

  constructor(init?: Partial<SocialLink>) {
    Object.assign(this, init);
  }
}
