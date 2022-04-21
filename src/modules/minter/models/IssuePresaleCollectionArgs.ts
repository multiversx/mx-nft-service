import { Field, InputType, registerEnumType } from '@nestjs/graphql';

@InputType()
export class IssuePresaleCollectionArgs {
  @Field()
  collectionIpfsHash: string;

  @Field({ description: 'This is the brand id used to identify a collection' })
  brandId: string;

  @Field(() => MediaTypeEnum)
  mediaTypes: MediaTypeEnum;

  @Field()
  royalties: string;

  @Field()
  maxNfts: number;

  @Field()
  mintStartTime: number;

  @Field()
  mintPriceToken: string = 'EGLD';

  @Field()
  mintPriceAmount: string;

  @Field()
  collectionName: string;

  @Field()
  collectionTicker: string;

  @Field(() => [String])
  tags: string[];
}

@InputType()
export class BuyRandomNftActionArgs {
  @Field(() => String)
  brandId: string;
  @Field(() => String)
  price: string;
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
