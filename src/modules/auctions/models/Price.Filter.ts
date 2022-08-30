import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PriceFilters {
  @Field(() => String)
  token: string = 'EGLD';
  constructor(init?: Partial<PriceFilters>) {
    Object.assign(this, init);
  }
}
