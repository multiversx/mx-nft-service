import { Tag } from './models';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { TagsService } from './tags.service';
import { TagsResponse } from './models/TagsResponse';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { TagsFilter } from './models/Tags.Filter';

@Resolver(() => Tag)
export class TagsResolver {
  constructor(private tagsService: TagsService) {}

  @Query(() => TagsResponse)
  async tags(
    @Args('filters', { type: () => TagsFilter })
    filters: TagsFilter,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<TagsResponse> {
    const { limit, offset } = getPagingParameters(pagination);
    const [tags, count] = await this.tagsService.getTags(offset, limit, filters);

    return PageResponse.mapResponse<Tag>(tags || [], pagination, count || 0, offset, limit);
  }
}
