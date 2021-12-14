import { ObjectType, Field, Int } from '@nestjs/graphql';
import { NftMetadata } from 'src/common';
@ObjectType()
export class Metadata {
  @Field(() => String)
  description: string;

  constructor(init?: Partial<Metadata>) {
    Object.assign(this, init);
  }

  static fromNftMetadata(metadata: NftMetadata) {
    return metadata
      ? new Metadata({
          description: metadata.description ?? '',
        })
      : null;
  }
}
