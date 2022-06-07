import { Field, InputType } from '@nestjs/graphql';
import { MinLength, IsOptional } from 'class-validator';

@InputType()
export class TagsFilter {
  @Field(() => String)
  @IsOptional()
  @MinLength(3, {
    message: 'The search term should contain at least 3 characters',
  })
  searchTerm: string;
  constructor(init?: Partial<TagsFilter>) {
    Object.assign(this, init);
  }
}
