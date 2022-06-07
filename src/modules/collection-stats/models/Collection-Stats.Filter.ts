import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import {
  nftIdentifierErrorMessage,
  nftIdentifierRgx,
} from 'src/utils/constants';

@InputType()
export class CollectionStatsFilter {
  @Field(() => String)
  @Matches(RegExp(nftIdentifierRgx), { message: nftIdentifierErrorMessage })
  identifier: string;
  constructor(init?: Partial<CollectionStatsFilter>) {
    Object.assign(this, init);
  }
}
