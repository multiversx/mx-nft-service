import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { NftTypeEnum } from '../../assets/models/NftTypes.enum';

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
  BETWEEN,
}

export enum Sort {
  ASC,
  DESC,
}

export enum GroupBy {
  IDENTIFIER,
}

registerEnumType(GroupBy, {
  name: 'GroupBy',
});
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
  values: string[];
  @Field(() => String)
  field: string;

  constructor(init?: Partial<Filter>) {
    Object.assign(this, init);
  }
}

@InputType()
export class ChildFilter {
  @Field(() => Operation)
  op: Operation;
  @Field(() => [String])
  values: string[];
  @Field(() => String)
  field: string;
  @Field(() => String, { nullable: true })
  relationField: String;

  constructor(init?: Partial<Filter>) {
    Object.assign(this, init);
  }
}

@InputType()
export class Sorting {
  @Field(() => String)
  field: string;
  @Field(() => Sort)
  direction: Sort;
}

@InputType()
export class Grouping {
  @Field(() => GroupBy)
  groupBy: GroupBy;
}

@InputType()
export class FiltersExpression {
  @Field(() => Operator)
  operator: Operator;
  @Field(() => [Filter])
  filters: Filter[];
  @Field(() => [ChildExpression], { nullable: true })
  childExpressions: [ChildExpression];
}

@InputType()
export class ChildExpression {
  @Field(() => Operator)
  operator: Operator;
  @Field(() => [ChildFilter])
  filters: ChildFilter[];
}

@InputType()
export class AssetsFilter {
  @Field(() => String, { nullable: true })
  ownerAddress: string;
  @Field(() => String, { nullable: true })
  creatorAddress: string;
  @Field(() => String, { nullable: true })
  identifier: string;
  @Field(() => [String], { nullable: true })
  identifiers: string[];
  @Field(() => String, { nullable: true })
  collection: string;
  @Field(() => [String], { nullable: true })
  tags: [string];
  @Field(() => String, { nullable: true })
  likedByAddress: string;
  @Field(() => NftTypeEnum, { nullable: true })
  type: NftTypeEnum;
  constructor(init?: Partial<AssetsFilter>) {
    Object.assign(this, init);
  }
}

@InputType()
export class CollectionsFilter {
  @Field(() => String, {
    nullable: true,
    description: 'The owner of the collection',
  })
  ownerAddress: string;
  @Field(() => String, {
    nullable: true,
    description: 'The user that has create role',
  })
  creatorAddress: string;
  @Field(() => Boolean, {
    nullable: true,
    description: 'Flag for can create or not on collection',
  })
  canCreate: boolean;
  @Field(() => String, {
    nullable: true,
    description: 'Collection identifier',
  })
  collection: string;
  @Field(() => NftTypeEnum, { nullable: true })
  type: NftTypeEnum;
}

@InputType()
export class AssetHistoryFilter {
  @Field(() => String)
  identifier: string;
}
