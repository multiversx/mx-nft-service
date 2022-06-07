import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import {
  nftIdentifierErrorMessage,
  nftIdentifierRgx,
} from 'src/utils/constants';

@InputType()
export class OwnersFilters {
  @Matches(RegExp(nftIdentifierRgx), { message: nftIdentifierErrorMessage })
  @Field(() => String)
  identifier: string;
}
