import { Entity, ManyToOne } from 'typeorm';
import { AccountEntity } from '../accounts/account.entity';
import { BaseEntity } from '../base-entity';

@Entity('followers')
export class FollowerEntity extends BaseEntity {
  @ManyToOne(() => AccountEntity, (account) => account.followers)
  follower: AccountEntity;

  @ManyToOne(() => AccountEntity, (account) => account.following)
  following: AccountEntity;
}
