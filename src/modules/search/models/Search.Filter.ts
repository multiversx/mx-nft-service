import { Field, InputType } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class SearchFilter {
  @Field(() => String)
  @MinLength(3, {
    message: 'The search term should contain at least 3 characters',
  })
  searchTerm: string;
  constructor(init?: Partial<SearchFilter>) {
    Object.assign(this, init);
  }
}
