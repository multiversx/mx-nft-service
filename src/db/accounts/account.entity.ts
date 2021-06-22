import { FollowerEntity } from '../followers/follower.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { OrderEntity } from '../orders/order.entity';
import { SocialLinkEntity } from '../socialLinks/social-link.entity';

@Entity('accounts')
export class AccountEntity extends BaseEntity {
  @Column({ length: 62, unique: true })
  address: string;

  @Column()
  description: string;

  @Column()
  profileImgUrl: string;

  @Column()
  coverImgUrl: string;

  @Column({ length: 62 })
  herotag: string;

  @OneToMany(() => OrderEntity, (order) => order.creationDate)
  orders: OrderEntity[];

  @OneToMany(() => FollowerEntity, (f) => f.follower)
  followers: FollowerEntity[];

  @OneToMany(() => FollowerEntity, (f) => f.following)
  following: FollowerEntity[];

  @OneToMany(() => SocialLinkEntity, (link) => link.id)
  socialLinks: SocialLinkEntity[];

  constructor(init?: Partial<AccountEntity>) {
    super();
    Object.assign(this, init);
  }
}
