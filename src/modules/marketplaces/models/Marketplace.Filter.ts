import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class MarketplaceFilters {
  @Field(() => String)
  marketplaceKey: string;
  constructor(init?: Partial<MarketplaceFilters>) {
    Object.assign(this, init);
  }
}
