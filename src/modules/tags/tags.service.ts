import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { TagsRepository } from 'src/db/auctions/tags.repository';
import { Tag } from './models';
import { TagTypeEnum } from './models/Tag-type.enum';
import { TagsFilter } from './models/Tags.Filter';

@Injectable()
export class TagsService {
  constructor(
    private apiService: ElrondApiService,
    private tagsRepository: TagsRepository,
  ) {}

  async getTags(
    offset: number = 0,
    limit: number = 10,
    filters: TagsFilter,
  ): Promise<[Tag[], number]> {
    if (filters.tagType === TagTypeEnum.Nft) {
      const [tagsApi, count] = await Promise.all([
        this.apiService.getTags(offset, limit, filters.searchTerm),
        this.apiService.getTagsCount(filters.searchTerm),
      ]);
      const tags = tagsApi?.map((element) => Tag.fromApiTag(element));
      return [tags, count];
    }
    const [tagsApi, count] = await Promise.all([
      this.tagsRepository.getTags(limit),
      this.tagsRepository.getTagsCount(),
    ]);
    const tags = tagsApi?.map((element) => Tag.fromApiTag(element));
    return [tags, count];
  }
}
