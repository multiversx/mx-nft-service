import { Field, InputType } from '@nestjs/graphql';
import { Matches, MaxLength, MinLength } from 'class-validator';

@InputType()
export class IssueCollectionArgs {
  @Field(() => String)
  @MinLength(3, { message: 'The token name should have at least 3 caracters' })
  @MaxLength(20, { message: 'The token name should have at most 20 caracters' })
  @Matches(RegExp('^[a-zA-Z0-9]+$'), {
    message: 'The token name should have only alphanumeric characters',
  })
  tokenName: string;

  @Field(() => String)
  @MinLength(3, {
    message: 'The token ticker should have at least 3 caracters',
  })
  @MaxLength(10, {
    message: 'The token ticker should have at most 10 caracters',
  })
  @Matches(RegExp('^[A-Z0-9]{2,9}$'), {
    message: 'The token ticker should have only alphanumeric UPPERCASE characters',
  })
  tokenTicker: string;

  @Field(() => Boolean)
  canFreeze: boolean = false;
  @Field(() => Boolean)
  canWipe: boolean = false;
  @Field(() => Boolean)
  canPause: boolean = false;
  @Field(() => Boolean)
  canTransferNFTCreateRole: boolean = false;
  @Field(() => Boolean)
  canChangeOwner: boolean = false;
  @Field(() => Boolean)
  canUpgrade: boolean = true;
  @Field(() => Boolean)
  canAddSpecialRoles: boolean = true;
}
