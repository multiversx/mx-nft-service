import { Field, InputType } from '@nestjs/graphql';
import { MinLength, IsOptional } from 'class-validator';
import { TagTypeEnum } from './Tag-type.enum';

@InputType()
export class TagsFilter {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(3, {
    message: 'The search term should contain at least 3 characters',
  })
  searchTerm: string;

  @Field(() => TagTypeEnum)
  tagType: TagTypeEnum = TagTypeEnum.Nft;
  constructor(init?: Partial<TagsFilter>) {
    Object.assign(this, init);
  }
}
