import { NftTag } from 'src/common/services/mx-communication/models';
import { EntityRepository, Repository } from 'typeorm';
import { TagEntity } from './tags.entity';

@EntityRepository(TagEntity)
export class TagsRepositoryMock extends Repository<TagEntity> {
  async getTags(_size: number): Promise<NftTag[]> {
    return [];
  }

  async getTagsCount(): Promise<number> {
    return 0;
  }
}
