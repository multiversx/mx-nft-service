import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class MarketplaceFilters {
  @Field(() => String, { nullable: true })
  marketplaceKey: string;

  @Field(() => String, { nullable: true })
  marketplaceAddress: string;
  constructor(init?: Partial<MarketplaceFilters>) {
    Object.assign(this, init);
  }
}
