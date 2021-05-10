import { OrderEntity } from 'src/db/orders/order.entity';
import { AssetEntity } from '../assets/asset.entity';
import { AuctionEntity } from '../auctions/auction.entity';
import { FollowerEntity } from '../followers/follower.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Account')
export class AccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 62,
    unique: true,
  })
  address: string;

  @Column({ length: 25 })
  profileImgUrl: string;

  @Column({ length: 25 })
  herotag: string;

  @Column('date')
  creationDate: Date;

  @OneToMany((type) => OrderEntity, (order) => order.creationDate)
  orders: OrderEntity[];

  @OneToMany((type) => AssetEntity, (asset) => asset.creator)
  createdAssets: AssetEntity[];

  @OneToMany((type) => AssetEntity, (asset) => asset.currentOwner)
  ownedAssets: AssetEntity[];

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
