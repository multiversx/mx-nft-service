import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { Operation, Filter, Sort } from './filtersTypes';

export enum AuctionCustomEnum {
  CURRENTPRICE,
}

registerEnumType(AuctionCustomEnum, {
  name: 'AuctionCustomEnum',
});

@InputType()
export class AuctionCustomSort {
  @Field(() => AuctionCustomEnum)
  field: AuctionCustomEnum;
  @Field(() => Sort)
  direction: Sort;
}

@InputType()
export class AuctionCustomFilter {
  @Field(() => Operation)
  op: Operation;

  @Field(() => [String], { nullable: 'itemsAndList' })
  values: string[];

  @Field(() => AuctionCustomEnum)
  field: AuctionCustomEnum;

  @Field(() => AuctionCustomSort, { nullable: true })
  sort: AuctionCustomSort;

  constructor(init?: Partial<Filter>) {
    Object.assign(this, init);
  }
}
