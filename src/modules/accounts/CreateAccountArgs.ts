import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FollowEntityArgs {
  @Field()
  addressToFollow: string;
}

@InputType()
export class UnfollowEntityArgs {
  @Field()
  addressToUnfollow: string;
}
