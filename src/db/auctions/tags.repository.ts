import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NftTag } from 'src/common/services/mx-communication/models';
import { constants } from 'src/config';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { Repository } from 'typeorm';
import { TagEntity } from './tags.entity';

@Injectable()
export class TagsRepository {
  constructor(
    @InjectRepository(TagEntity)
    private tagsRepository: Repository<TagEntity>,
  ) {}
  async getTags(size: number): Promise<NftTag[]> {
    const tags: NftTag[] = await this.tagsRepository
      .createQueryBuilder('t')
      .select('count(a.id) as count, t.tag')
      .innerJoin('auctions', 'a', 't.auctionId=a.id')
      .where(`a.status= :status`, {
        status: AuctionStatusEnum.Running,
      })
      .groupBy('t.tag')
      .orderBy('count', 'DESC')
      .limit(size)
      .getRawMany();
    return tags;
  }

  async getTagsBySearchTerm(searchTerm: string, page: number = 0, size: number = 10): Promise<NftTag[]> {
    const tags: NftTag[] = await this.tagsRepository
      .createQueryBuilder('t')
      .select('count(a.id) as count, t.tag')
      .innerJoin('auctions', 'a', 't.auctionId=a.id')
      .where(`a.status= :status`, {
        status: AuctionStatusEnum.Running,
      })
      .andWhere('t.tag LIKE :tag', { tag: `%${searchTerm}%` })
      .groupBy('t.tag')
      .orderBy('count', 'DESC')
      .offset(page)
      .limit(size)
      .getRawMany();
    return tags;
  }

  async getTagsCount(): Promise<number> {
    const { count } = await this.tagsRepository
      .createQueryBuilder('t')
      .select('COUNT (DISTINCT(tag))', 'count')
      .innerJoin('auctions', 'a', 't.auctionId=a.id')
      .where(`a.status= :status`, {
        status: AuctionStatusEnum.Running,
      })
      .getRawOne();
    return count;
  }

  async getTagsBySearchTermCount(searchTerm: string): Promise<number> {
    const { count } = await this.tagsRepository
      .createQueryBuilder('t')
      .select('COUNT(DISTINCT(tag))', 'count')
      .innerJoin('auctions', 'a', 't.auctionId=a.id')
      .where(`a.status= :status`, {
        status: AuctionStatusEnum.Running,
      })
      .andWhere('t.tag LIKE :tag', { tag: `%${searchTerm}%` })
      .getRawOne();
    return count;
  }

  async saveTags(tags: TagEntity[]): Promise<TagEntity[]> {
    try {
      return await this.tagsRepository.save(tags, { chunk: constants.dbBatch });
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }
}
