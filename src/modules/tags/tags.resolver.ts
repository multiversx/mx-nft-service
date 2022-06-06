import { Tag } from './models';
import { Query, Resolver } from '@nestjs/graphql';
import { TagsService } from './tags.service';

@Resolver(() => Tag)
export class TagsResolver {
  constructor(private tagsService: TagsService) {}

  @Query(() => [Tag])
  async tags(): Promise<Tag[]> {
    return await this.tagsService.getTags();
  }
}
