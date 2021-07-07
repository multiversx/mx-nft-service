import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('followers')
@Unique('FollowEntity_UQ_Follow', ['followerAddress', 'followingAddress'])
export class FollowerEntity extends BaseEntity {
  @Column({ length: 62 })
  followerAddress: string;

  @Column({ length: 62 })
  followingAddress: string;

  constructor(init?: Partial<FollowerEntity>) {
    super();
    Object.assign(this, init);
  }
}
