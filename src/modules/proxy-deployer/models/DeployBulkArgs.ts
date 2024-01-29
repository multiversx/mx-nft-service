import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX } from 'src/utils/constants';

@InputType()
export class DeployBulkArgs {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  ownerAddress: string;

  maxNftsPerTransaction: number;
}
