import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class IssueCollectionArgs {
  @Field(() => String)
  tokenName: string;
  @Field(() => String)
  tokenTicker: string;
  @Field(() => Boolean)
  canFreeze: boolean = false;
  @Field(() => Boolean)
  canWipe: boolean = false;
  @Field(() => Boolean)
  canPause: boolean = false;
  @Field(() => Boolean)
  canTransferNFTCreateRole: boolean = false;
}
