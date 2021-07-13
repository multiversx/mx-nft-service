import { ObjectType, Field, Int } from '@nestjs/graphql';
import { NftMetadata } from 'src/common/services/elrond-communication/models/nftMetadata';
@ObjectType()
export class Metadata {
  @Field(() => String)
  description: string;
  @Field(() => String)
  fileType!: string;
  @Field(() => String)
  fileUri: string;
  @Field(() => String)
  fileName: string;

  constructor(init?: Partial<Metadata>) {
    Object.assign(this, init);
  }

  static fromNftMetadata(metadata: NftMetadata) {
    return metadata
      ? new Metadata({
          description: metadata.description,
          fileName: metadata.fileName,
          fileType: metadata.fileType,
          fileUri: metadata.fileUri,
        })
      : null;
  }
}
