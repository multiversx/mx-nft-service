import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import {
  ADDRESS_RGX,
  ADDRESS_ERROR,
  NFT_IDENTIFIER_RGX,
  NFT_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_RGX,
} from 'src/utils/constants';
import { OfferStatusEnum } from './Offer-status.enum';

@InputType()
export class OffersFilters {
  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, {
    nullable: true,
    description: 'The owner of the offer',
  })
  ownerAddress: string;

  @IsOptional()
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String, {
    nullable: true,
    description: 'The nft identifier for the offers',
  })
  identifier: string;

  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String, {
    nullable: true,
    description: 'The collection identifier for the offers',
  })
  collectionIdentifier: string;

  @Field(() => String, {
    nullable: true,
    description: 'The marketplace key for the offers',
  })
  marketplaceKey: string;

  @Field(() => String, {
    nullable: true,
    description: 'The payment token for the offers',
  })
  priceToken: string;

  @Field(() => [OfferStatusEnum], {
    nullable: true,
    description: 'The offer status',
  })
  status: OfferStatusEnum[];

  constructor(init?: Partial<OffersFilters>) {
    Object.assign(this, init);
  }
}
