import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX } from 'src/utils/constants';

@InputType()
export class DeployMinterArgs {
  @Field()
  collectionCategory: string;

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  royaltiesClaimAddress: string;

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  ownerAddress: string;

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  mintClaimAddress: string;

  @Field(() => Int)
  maxNftsPerTransaction: number;
}

@InputType()
export class UpgradeMinterArgs {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  minterAddress: string;
}
