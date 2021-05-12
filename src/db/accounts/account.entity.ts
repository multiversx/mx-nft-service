import { OrderEntity } from 'src/db/orders/order.entity';
import { AuctionEntity } from '../auctions/auction.entity';
import { FollowerEntity } from '../followers/follower.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 62,
    unique: true,
  })
  address: string;

  @Column()
  profileImgUrl: string;

  @Column()
  herotag: string;

  @Column('date')
  creationDate: Date = new Date(new Date().toUTCString());

  @OneToMany((type) => OrderEntity, (order) => order.creationDate)
  orders: OrderEntity[];

  @OneToMany((type) => AuctionEntity, (auction) => auction.owner)
  auctions: AuctionEntity[];

  @OneToMany(() => FollowerEntity, (f) => f.follower)
  followers: FollowerEntity[];

  @OneToMany(() => FollowerEntity, (f) => f.following)
  following: FollowerEntity[];

  constructor(init?: Partial<AccountEntity>) {
    Object.assign(this, init);
  }
}
