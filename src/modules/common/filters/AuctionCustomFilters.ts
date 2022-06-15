import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { Operation, Filter, Sort } from './filtersTypes';

export enum AuctionCustomFilterEnum {
  CURRENTPRICE,
}
export enum AuctionCustomSortEnum {
  CURRENTPRICE,
}

registerEnumType(AuctionCustomSortEnum, {
  name: 'AuctionCustomSortEnum',
});

registerEnumType(AuctionCustomFilterEnum, {
  name: 'AuctionCustomFilterEnum',
});

@InputType()
export class AuctionCustomSort {
  @Field(() => AuctionCustomSortEnum)
  field: AuctionCustomSortEnum;
  @Field(() => Sort)
  direction: Sort;
}

@InputType()
export class AuctionCustomFilters {
  @Field(() => Operation)
  op: Operation;

  @Field(() => [String], { nullable: 'itemsAndList' })
  values: string[];

  @Field(() => AuctionCustomFilterEnum)
  field: AuctionCustomFilterEnum;

  @Field(() => AuctionCustomSort)
  sort: AuctionCustomSort;

  constructor(init?: Partial<Filter>) {
    Object.assign(this, init);
  }
}
