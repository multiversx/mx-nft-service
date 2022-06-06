import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { Tag } from './models';

@Injectable()
export class TagsService {
  constructor(private apiService: ElrondApiService) {}

  async getTags(offset: number = 0, limit: number = 10): Promise<Tag[]> {
    const tags = await this.apiService.getTags(offset, limit);
    return tags?.map((element) => Tag.fromApiTag(element));
  }
}
