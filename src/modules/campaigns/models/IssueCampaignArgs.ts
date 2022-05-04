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
  @Field(() => String)
  campaignId: string;
  @Field(() => String)
  tier: string;
  @Field(() => String)
  price: string;
  @Field(() => String)
  minterAddress: string;
  @Field(() => String, { nullable: true })
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
