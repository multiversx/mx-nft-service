import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsOptional, Matches, MinLength } from 'class-validator';
import { NftTypeEnum } from 'src/modules/assets/models';
import { ADDRESS_RGX, ADDRESS_ERROR, COLLECTION_IDENTIFIER_RGX, COLLECTION_IDENTIFIER_ERROR } from 'src/utils/constants';

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
    description: 'The actual artist of the collection',
  })
  artistAddress: string;

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

  @Field(() => Boolean, {
    nullable: true,
    description: 'Flag for verified collections',
  })
  verified: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Flag for collections where owner address has nfts',
  })
  withNfts: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Flag for active last 30 days',
  })
  activeLast30Days: boolean;

  @IsOptional()
  @Field(() => String, { nullable: true })
  @MinLength(3, {
    message: 'The search term should contain at least 3 characters',
  })
  searchTerm: string;
}
@InputType()
export class AssetsCollectionFilter {
  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, {
    nullable: true,
    description: 'The owner of the collection',
  })
  ownerAddress: string;
}

export enum CollectionsSortingEnum {
  Verified = 'Verified',
  Newest = 'Newest',
  Trending = 'Trending',
}

registerEnumType(CollectionsSortingEnum, {
  name: 'CollectionsSortingEnum',
});
