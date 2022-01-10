import { ObjectType, Field } from '@nestjs/graphql';
import { NftMetadata } from 'src/common';
@ObjectType()
export class Metadata {
  @Field(() => String, { nullable: true })
  description: string;
  @Field(() => String, {
    nullable: true,
    deprecationReason: 'This field will be removed in the next version',
  })
  fileType: string;
  @Field(() => String, {
    nullable: true,
    deprecationReason: 'This field will be removed in the next version',
  })
  fileUri: string;
  @Field(() => String, {
    nullable: true,
    deprecationReason: 'This field will be removed in the next version',
  })
  fileName: string;

  constructor(init?: Partial<Metadata>) {
    Object.assign(this, init);
  }

  static fromNftMetadata(metadata: NftMetadata) {
    return metadata
      ? new Metadata({
          description: metadata?.description,
        })
      : null;
  }
}
