import { Tag } from './models';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { TagsService } from './tags.service';
import { TagsResponse } from './models/TagsResponse';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';

@Resolver(() => Tag)
export class TagsResolver {
  constructor(private tagsService: TagsService) {}

  @Query(() => TagsResponse)
  async tags(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<TagsResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [tags, count] = await this.tagsService.getTags(offset, limit);

    return PageResponse.mapResponse<Tag>(
      tags || [],
      pagination,
      count || 0,
      offset,
      limit,
    );
  }
}
