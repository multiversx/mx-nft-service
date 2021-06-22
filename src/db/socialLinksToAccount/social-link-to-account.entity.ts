import { Entity, ManyToOne } from 'typeorm';
import { AccountEntity } from '../accounts/account.entity';
import { BaseEntity } from '../base-entity';
import { SocialLinkEntity } from '../socialLinks/social-link.entity';

@Entity('social_links')
export class SocialLinkToAccountEntity extends BaseEntity {
  @ManyToOne(() => SocialLinkEntity, (link) => link.accounts)
  socialLink: SocialLinkEntity;

  @ManyToOne(() => AccountEntity, (account) => account.socialLinks)
  account: AccountEntity;
}
