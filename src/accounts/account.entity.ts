import { AuctionEntity } from 'src/auctions/auction.entity';
import { OrderEntity } from 'src/orders/order.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Account')
export class AccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  address: string;

  @Column({ length: 25 })
  profileImgUrl: string;

  @Column({ length: 25 })
  username: string;

  @Column('date')
  creationDate: Date;

  @OneToMany((type) => OrderEntity, (order) => order.creationDate)
  orders: OrderEntity[];

  @OneToMany((type) => AuctionEntity, (auction) => auction.owner)
  auctions: AuctionEntity[];
}
