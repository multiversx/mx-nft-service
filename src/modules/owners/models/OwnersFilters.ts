import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class OwnersFilters {
  @Field(() => String)
  identifier: string;
}
