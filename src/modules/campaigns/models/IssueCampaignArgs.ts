import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

@InputType()
export class IssueCampaignArgs {
  @Field()
  collectionIpfsHash: string;

  @Field()
  campaignId: string;

  @Field()
  minterAddress: string;

  @Field(() => MediaTypeEnum)
  mediaTypes: MediaTypeEnum;

  @Field()
  royalties: string;

  @Field(() => Int)
  mintStartTime: number;

  @Field(() => Int)
  mintEndTime: number;

  @Field(() => Int)
  whitelistEndTime: number;

  @Field()
  mintPriceToken: string = 'EGLD';

  @Field()
  collectionName: string;

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
    description:
      'The total price the user needs to pay in order to buy the number of nfts selected',
  })
  price: string;
  @Field(() => String, {
    description: 'The smart contract address of the campaign',
  })
  minterAddress: string;
  @Field(() => String, {
    nullable: true,
    description: 'The number of nfts the user wants to buy',
  })
  quantity: string;
}

export enum MediaTypeEnum {
  png = 'image/png',
  jpeg = 'image/jpeg',
  jpg = 'image/jpg',
  gif = 'image/gif',

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
