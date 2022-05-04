import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { TierEntity } from './tiers.entity';

@Entity('tier_details')
export class TierDetailEntity extends BaseEntity {
  @Column()
  tierId: number;

  @Column()
  info: string;

  @ManyToOne(() => TierEntity, (campaign) => campaign.tierDetails)
  @JoinColumn({ name: 'tierId', referencedColumnName: 'id' })
  tier: TierEntity;

  constructor(init?: Partial<TierDetailEntity>) {
    super();
    Object.assign(this, init);
  }
}
