import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { Matches, MaxLength, MinLength } from 'class-validator';
import { mxConfig } from 'src/config';
import { ADDRESS_ERROR, ADDRESS_RGX, NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX, NUMERIC_ERROR, NUMERIC_RGX } from 'src/utils/constants';

@InputType()
export class IssueCampaignArgs {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  ownerAddress: string;

  @Field()
  collectionIpfsHash: string;

  @Field()
  campaignId: string;

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  minterAddress: string;

  @Field(() => MediaTypeEnum)
  mediaTypes: MediaTypeEnum;

  @Matches(RegExp(NUMERIC_RGX), { message: `Royalties ${NUMERIC_ERROR}` })
  @Field()
  royalties: string;

  @Field(() => Int)
  mintStartTime: number;

  @Field(() => Int)
  mintEndTime: number;

  @Field(() => Int)
  whitelistEndTime: number;

  @Field()
  mintPriceToken: string = mxConfig.egld;

  @MinLength(3, { message: 'The token name should have at least 3 caracters' })
  @MaxLength(20, { message: 'The token name should have at most 20 caracters' })
  @Matches(RegExp('^[a-zA-Z0-9]+$'), {
    message: 'The token name should have only alphanumeric characters',
  })
  @Field()
  collectionName: string;

  @MinLength(3, {
    message: 'The token ticker should have at least 3 caracters',
  })
  @MaxLength(10, {
    message: 'The token ticker should have at most 10 caracters',
  })
  @Matches(RegExp('^[A-Z][A-Z0-9]{2,9}$'), {
    message: 'The token ticker should have only alphanumeric UPPERCASE characters',
  })
  @Field()
  collectionTicker: string;

  @Field(() => [String])
  tags: string[];

  @Field(() => [TierArgs])
  tiers: TierArgs[];
}

@InputType()
export class TierArgs {
  @Field(() => String)
  tierName: string;
  @Field(() => Int)
  totalNfts: number;

  @Matches(RegExp(NUMERIC_RGX), {
    message: `Mint price amount ${NUMERIC_ERROR}`,
  })
  @Field(() => String)
  mintPriceAmount: string;
}

@InputType()
export class BuyRandomNftActionArgs {
  @Field(() => String, {
    description: 'The campaign id where the user wants to buy the nft/s',
  })
  campaignId: string;
  @Field(() => String, {
    description: 'The tier name on which the user wants to buy the nft',
  })
  tier: string;

  @Field(() => String, {
    description: 'The total price the user needs to pay in order to buy the number of nfts selected',
  })
  @Matches(RegExp(NUMERIC_RGX), { message: `Price ${NUMERIC_ERROR}` })
  price: string;

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, {
    description: 'The smart contract address of the campaign',
  })
  minterAddress: string;

  @Matches(RegExp(NUMERIC_RGX), { message: `Quantity ${NUMERIC_ERROR}` })
  @Field(() => String, {
    nullable: true,
    description: 'The number of nfts the user wants to buy',
  })
  quantity: string;
}

@InputType()
export class UpgradeNftArgs {
  @Field(() => String, {
    description: 'The campaign id where the user wants to buy the nft/s',
  })
  campaignId: string;
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String, {
    description: 'The smart contract address of the campaign',
  })
  minterAddress: string;

  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String, {
    description: 'The identifier of the nft to be upgraded',
  })
  identifier: string;
}

export enum MediaTypeEnum {
  png = 'image/png',
  jpeg = 'image/jpeg',
  jpg = 'image/jpg',
  gif = 'image/gif',
  webp = 'image/webp',
  svg = 'image/svg',
  svgXml = 'image/svg+xml',

  aac = 'audio/aac',
  flac = 'audio/flac',
  m4a = 'audio/m4a',
  mp3 = 'audio/mpeg',
  wav = 'audio/wav',

  mov = 'video/mov',
  mov2 = 'video/quicktime',
  mp4 = 'video/mp4',
  webm = 'video/webm',
}

registerEnumType(MediaTypeEnum, {
  name: 'MediaTypeEnum',
});
