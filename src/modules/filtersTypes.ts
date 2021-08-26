import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { NftTypeEnum } from './assets/models/NftTypes.enum';

export enum Operator {
  AND,
  OR,
}

export enum Operation {
  EQ,
  IN,
  LIKE,
  GE,
  LE,
}

export enum Sort {
  ASC,
  DESC,
}

registerEnumType(Operator, {
  name: 'Operator',
});
registerEnumType(Operation, {
  name: 'Operation',
});
registerEnumType(Sort, {
  name: 'Sort',
});

@InputType()
export class Filter {
  @Field(() => Operation)
  op: Operation;
  @Field(() => [String])
  values: string;
  @Field(() => String)
  field: string;
}

@InputType()
export class Sorting {
  @Field(() => String)
  field: string;
  @Field(() => Sort)
  direction: Sort;
}

@InputType()
export class FiltersExpression {
  @Field(() => Operator)
  operator: Operator;
  @Field(() => [Filter])
  filters: [Filter];
}

@InputType()
export class AssetsFilter {
  @Field(() => String, { nullable: true })
  ownerAddress: string;
  @Field(() => String, { nullable: true })
  creatorAddress: string;
  @Field(() => String, { nullable: true })
  identifier: string;
  @Field(() => String, { nullable: true })
  collection: string;
  @Field(() => [String], { nullable: true })
  tags: [string];
  @Field(() => String, { nullable: true })
  likedByAddress: string;
  @Field(() => NftTypeEnum, { nullable: true })
  type: NftTypeEnum;
}
