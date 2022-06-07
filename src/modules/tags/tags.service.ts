import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { Tag } from './models';

@Injectable()
export class TagsService {
  constructor(private apiService: ElrondApiService) {}

  async getTags(
    offset: number = 0,
    limit: number = 10,
  ): Promise<[Tag[], number]> {
    const [tagsApi, count] = await Promise.all([
      this.apiService.getTags(offset, limit),
      this.apiService.getTagsCount(),
    ]);
    const tags = tagsApi?.map((element) => Tag.fromApiTag(element));
    return [tags, count];
  }
}
