import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FollowEntityArgs {
  @Field()
  address: string;
  @Field()
  addressToFollow: string;
}

@InputType()
export class UnfollowEntityArgs {
  @Field()
  address: string;
  @Field()
  addressToUnfollow: string;
}
