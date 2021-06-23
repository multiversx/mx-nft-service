import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { SocialLinksServiceDb } from 'src/db/socialLinks/social-link.service';
import { SocialLink } from './models';

@Injectable()
export class SocialLinksService {
  constructor(private socialLinksServiceDb: SocialLinksServiceDb) {}

  async getSocialLinks(
    limit: number,
    offset: number,
  ): Promise<[SocialLink[], number]> {
    const [socialLinks, count] = await this.socialLinksServiceDb.getSocialLinks(
      limit,
      offset,
    );
    return [
      socialLinks.map((element) => SocialLink.fromEntity(element)),
      count,
    ];
  }
}
