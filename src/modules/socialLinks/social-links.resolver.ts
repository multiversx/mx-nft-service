import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { SocialLinksService } from './social-links.service';
import SocialLinksResponse from './models/SocialLinksResponse';
import { SocialLink } from './models';
import ConnectionArgs from '../ConnectionArgs';
import { connectionFromArraySlice } from 'graphql-relay';

@Resolver(() => SocialLink)
export class SocialLinksResolver extends BaseResolver(SocialLink) {
  constructor(private socialLinksService: SocialLinksService) {
    super();
  }

  @Query(() => SocialLinksResponse)
  async socialLinks(
    @Args() args: ConnectionArgs,
  ): Promise<SocialLinksResponse> {
    const { limit, offset } = args.pagingParams();
    const [socialLinks, count] = await this.socialLinksService.getSocialLinks(
      limit,
      offset,
    );
    const page = connectionFromArraySlice(socialLinks, args, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }
}
