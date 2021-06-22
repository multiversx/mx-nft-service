import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialLinkEntity } from './social-link.entity';

@Injectable()
export class SocialLinksServiceDb {
  constructor(
    @InjectRepository(SocialLinkEntity)
    private socialLinkRepository: Repository<SocialLinkEntity>,
  ) {}

  async getSocialLinks(): Promise<SocialLinkEntity[] | any[]> {
    const socialLink = await this.socialLinkRepository
      .createQueryBuilder('socialLinks')
      .select()
      .getMany();
    return socialLink;
  }
}
