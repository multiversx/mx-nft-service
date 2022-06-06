import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SearchFilter {
  @Field(() => String)
  searchTerm: string;
  constructor(init?: Partial<SearchFilter>) {
    Object.assign(this, init);
  }
}
