import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX, COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class SetNftRolesArgs {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  collection: string;

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String)
  addressToTransfer: string;
  @Field(() => [String])
  roles: string[];
}
