import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { NftTag } from 'src/common';

@ObjectType()
export class Tag {
  @Field(() => ID)
  tag: string;
  @Field(() => Int, { nullable: true })
  count: number;

  constructor(init?: Partial<Tag>) {
    Object.assign(this, init);
  }

  static fromApiTag(tag: NftTag) {
    return new Tag({
      tag: tag.tag,
      count: tag.count,
    });
  }
}
