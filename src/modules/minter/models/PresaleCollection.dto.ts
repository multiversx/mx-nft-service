import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BrandInfo } from '.';

@ObjectType()
export class PresaleCollection {
  @Field(() => ID)
  collectionIpfhHash: number;

  @Field(() => String)
  collectionName: string;

  @Field(() => String)
  mediaType: string;

  @Field(() => String)
  collectionTicker: string;

  constructor(init?: Partial<PresaleCollection>) {
    Object.assign(this, init);
  }

  static fromEntity(auction: BrandInfo) {
    return new PresaleCollection({});
  }
}
