import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from './tag.entity';

@Injectable()
export class TagsServiceDb {
  constructor(
    @InjectRepository(TagEntity)
    private tagsRepository: Repository<TagEntity>,
  ) {}

  async getTagsByTagName(tags: string[]): Promise<TagEntity[]> {
    return await this.tagsRepository
      .createQueryBuilder('Tag')
      .where('Tag.tag IN (:tags)', { tags: tags })
      .getMany();
  }

  async getTagsByTokenIdentifier(
    tokenIdentifier: string,
  ): Promise<TagEntity[]> {
    return await this.tagsRepository.find({
      select: ['id', 'tokenIdentifier', 'tag'],
      where: [{ tokenIdentifier: tokenIdentifier }],
    });
  }

  async saveTags(tags: TagEntity[]) {
    return await this.tagsRepository.save(tags);
  }
}
