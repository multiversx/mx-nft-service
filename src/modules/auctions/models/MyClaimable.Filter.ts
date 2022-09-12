import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class MyClaimableAuctionsFilters {
  @Field(() => String)
  marketplaceKey: string;
  constructor(init?: Partial<MyClaimableAuctionsFilters>) {
    Object.assign(this, init);
  }
}
