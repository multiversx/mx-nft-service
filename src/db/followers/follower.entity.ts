import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from '../accounts/account.entity';

@Entity('followers')
export class FollowerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AccountEntity, (account) => account.followers)
  follower: AccountEntity;

  @ManyToOne(() => AccountEntity, (account) => account.following)
  following: AccountEntity;
}
