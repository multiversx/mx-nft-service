import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import {
  ADDRESS_ERROR,
  ADDRESS_RGX,
  COLLECTION_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_RGX,
  NFT_IDENTIFIER_ERROR,
  NFT_IDENTIFIER_RGX,
} from 'src/utils/constants';
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
  @Field(() => Operation, { nullable: true })
  op: Operation;
  @Field(() => [String], { nullable: true })
  values: string[];
  @Field(() => String, { nullable: true })
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
  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, { nullable: true })
  ownerAddress: string;

  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, { nullable: true })
  creatorAddress: string;

  @IsOptional()
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String, { nullable: true })
  identifier: string;

  @Field(() => [String], { nullable: true })
  identifiers: string[];

  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String, { nullable: true })
  collection: string;

  @Field(() => [String], { nullable: true })
  tags: [string];

  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
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
  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, {
    nullable: true,
    description: 'The owner of the collection',
  })
  ownerAddress: string;

  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
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

  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String, {
    nullable: true,
    description: 'Collection identifier',
  })
  collection: string;
  @Field(() => NftTypeEnum, { nullable: true })
  type: NftTypeEnum;
}

@InputType()
export class CampaignsFilter {
  @Field(() => String)
  campaignId: string;

  @Field(() => String)
  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  minterAddress: string;
}

@InputType()
export class AssetHistoryFilter {
  @Field(() => String)
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  identifier: string;
}
