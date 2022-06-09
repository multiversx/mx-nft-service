import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AuctionEntity } from '.';
import { BaseEntity } from '../base-entity';

@Entity('tags')
export class TagEntity extends BaseEntity {
  @Column()
  auctionId: number;

  @Column({ length: 20 })
  tag: string;

  @ManyToOne(() => AuctionEntity, (auction) => auction.tagEntities)
  @JoinColumn({ name: 'auctionId', referencedColumnName: 'id' })
  auction: AuctionEntity;

  constructor(init?: Partial<TagEntity>) {
    super();
    Object.assign(this, init);
  }
}
