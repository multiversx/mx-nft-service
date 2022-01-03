import { ObjectType, Field } from '@nestjs/graphql';
import { NftMedia } from 'src/common';
@ObjectType()
export class Media {
  @Field(() => String, { nullable: true })
  url: string;
  @Field(() => String, { nullable: true })
  originalUrl: string;
  @Field(() => String, { nullable: true })
  thumbnailUrl: string;
  @Field(() => String, { nullable: true })
  fileSize: string;
  @Field(() => String, { nullable: true })
  fileType: string;

  constructor(init?: Partial<Media>) {
    Object.assign(this, init);
  }

  static fromNftMedia(media: NftMedia) {
    return media
      ? new Media({
          url: media.url,
          originalUrl: media.originalUrl,
          thumbnailUrl: media.thumbnailUrl,
          fileSize: media.fileSize,
          fileType: media.fileType,
        })
      : null;
  }
}
