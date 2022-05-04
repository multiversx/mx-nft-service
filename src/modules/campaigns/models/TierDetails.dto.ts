import { Field, ID, ObjectType } from '@nestjs/graphql';
import { TierDetailEntity } from 'src/db/campaigns/tier-details.entity';

@ObjectType()
export class TierDetail {
  @Field(() => ID)
  tierDetailId!: number;

  @Field(() => String)
  info!: string;
  constructor(init?: Partial<TierDetail>) {
    Object.assign(this, init);
  }

  static fromEntity(tier: TierDetailEntity) {
    return tier
      ? new TierDetail({
          info: tier.info,
          tierDetailId: tier.id,
        })
      : null;
  }
}
