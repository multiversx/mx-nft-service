import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from '../accounts/account.entity';

@Entity('social_links')
export class SocialLinkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  name: string;

  @Column()
  iconName: string;

  @ManyToOne(() => AccountEntity, (account) => account.socialLinks)
  accounts: AccountEntity;

  constructor(init?: Partial<SocialLinkEntity>) {
    Object.assign(this, init);
  }
}
