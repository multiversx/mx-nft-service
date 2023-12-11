import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsOptional, Matches, MinLength } from 'class-validator';
import { NftTrait } from 'src/modules/nft-traits/models/nft-traits.model';
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
  @Field(() => Operation)
  op: Operation;
  @Field(() => [String], { nullable: 'itemsAndList' })
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
  constructor(init?: Partial<Grouping>) {
    Object.assign(this, init);
  }

  @Field(() => GroupBy)
  groupBy: GroupBy;
}

@InputType()
export class FiltersExpression {
  constructor(init?: Partial<FiltersExpression>) {
    Object.assign(this, init);
  }

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
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, { nullable: true })
  artistAddress: string;

  @IsOptional()
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String, { nullable: true })
  identifier: string;

  @IsOptional()
  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
    each: true,
  })
  @Field(() => [String], { nullable: true })
  identifiers: string[];

  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String, { nullable: true })
  collection: string;

  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
    each: true,
  })
  @Field(() => [String], {
    nullable: true,
    description: 'This will work only with an owner address',
  })
  collections: string[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  tags: [string];

  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, { nullable: true })
  likedByAddress: string;

  @IsOptional()
  @Field(() => NftTypeEnum, { nullable: true })
  type: NftTypeEnum;

  @Field(() => [NftTrait], { nullable: 'itemsAndList' })
  traits: NftTrait[];

  @IsOptional()
  @Field(() => String, { nullable: true })
  @MinLength(3, {
    message: 'The search term should contain at least 3 characters',
  })
  searchTerm: string;

  constructor(init?: Partial<AssetsFilter>) {
    Object.assign(this, init);
  }
}

@InputType()
export class CampaignsFilter {
  @Field(() => String, { nullable: true })
  campaignId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  minterAddress: string;

  constructor(init?: Partial<CampaignsFilter>) {
    Object.assign(this, init);
  }
}

@InputType()
export class AssetHistoryFilter {
  @Field(() => String)
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  identifier: string;
}
