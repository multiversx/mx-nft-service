import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import { NftTypeEnum } from 'src/modules/assets/models';
import {
  ADDRESS_RGX,
  ADDRESS_ERROR,
  COLLECTION_IDENTIFIER_RGX,
  COLLECTION_IDENTIFIER_ERROR,
} from 'src/utils/constants';

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

export enum CollectionsSortingEnum {
  Verified = 'Verified',
  Newest = 'Newest',
}

registerEnumType(CollectionsSortingEnum, {
  name: 'CollectionsSortingEnum',
});
