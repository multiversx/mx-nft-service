import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX } from 'src/utils/constants';

@InputType()
export class WhitelistMinterArgs {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  address: string;

  @Field()
  name: string;

  @Field()
  description: string;
}
