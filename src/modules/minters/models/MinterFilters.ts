import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX } from 'src/utils/constants';

@InputType()
export class MinterFilters {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  minterAddress: string;

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  minterAdminAddress: string;

  constructor(init?: Partial<MinterFilters>) {
    Object.assign(this, init);
  }
}
