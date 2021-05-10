import { AccountEntity } from 'src/db/accounts/account.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Assets')
export class AssetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  tokenId: string;

  @Column()
  tokenNonce: string;

  @Column({ length: 25 })
  name: string;

  @Column()
  hash: string;

  @Column({ length: 25 })
  royalties: string;

  @Column('date')
  creationDate: Date;

  @ManyToOne((type) => AccountEntity, (account) => account.ownedAssets)
  currentOwner: AccountEntity;

  @ManyToOne((type) => AccountEntity, (account) => account.createdAssets)
  creator: AccountEntity;
}
