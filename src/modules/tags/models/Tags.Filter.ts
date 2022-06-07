import { Field, InputType } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class TagsFilter {
  @Field(() => String)
  @MinLength(3, {
    message: 'The search term should contain at least 3 characters',
  })
  searchTerm: string;
  constructor(init?: Partial<TagsFilter>) {
    Object.assign(this, init);
  }
}
