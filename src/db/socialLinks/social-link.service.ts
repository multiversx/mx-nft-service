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

  async getSocialLinks(
    limit: number = 50,
    offset: number = 0,
  ): Promise<[SocialLinkEntity[], number]> {
    return this.socialLinkRepository.findAndCount({
      skip: offset,
      take: limit,
    });
  }
}
