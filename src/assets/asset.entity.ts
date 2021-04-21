import { AccountEntity } from 'src/accounts/account.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('Asset')
export class AssetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  tokenId: string;

  @Column({ length: 25 })
  name: string;

  @Column({ length: 25 })
  royalties: string;

  @Column('date')
  creationDate: Date;

  @Column()
  tokenNonce: string;

  @OneToOne((type) => AccountEntity)
  @JoinColumn()
  currentOwner: AccountEntity;

  @OneToOne((type) => AccountEntity)
  @JoinColumn()
  creator: AccountEntity;
}
