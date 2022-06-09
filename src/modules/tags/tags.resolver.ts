import { Tag } from './models';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { TagsService } from './tags.service';
import { TagsResponse } from './models/TagsResponse';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { TagsFilter } from './models/Tags.Filter';

@Resolver(() => Tag)
export class TagsResolver {
  constructor(private tagsService: TagsService) {}

  @Query(() => TagsResponse)
  async tags(
    @Args('filters', { type: () => TagsFilter })
    filters: TagsFilter,
  ): Promise<TagsResponse> {
    const pagination = new ConnectionArgs();
    const { limit, offset } = pagination.pagingParams();
    const [tags, count] = await this.tagsService.getTags(
      offset,
      limit,
      filters,
    );

    return PageResponse.mapResponse<Tag>(
      tags || [],
      pagination,
      count || 0,
      offset,
      limit,
    );
  }
}
