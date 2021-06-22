import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialLinkToAccountEntity } from './social-link-to-account.entity';

@Injectable()
export class SocialLinksToAccountServiceDb {
  constructor(
    @InjectRepository(SocialLinkToAccountEntity)
    private socialLinkRepository: Repository<SocialLinkToAccountEntity>,
  ) {}

  async getSocialLinksForAccount(
    accountId: number,
  ): Promise<SocialLinkToAccountEntity[] | any[]> {
    const following = await this.socialLinkRepository
      .createQueryBuilder('socialLink')
      .leftJoinAndSelect(
        'socialLink.account',
        'account',
        'socialLink.following = account.id',
      )
      .where('socialLink.accounts = :id', { id: accountId })
      .getMany();

    return following.map((x) => x.account);
  }
}
