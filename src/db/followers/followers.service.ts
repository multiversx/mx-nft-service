import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../accounts/account.entity';
import { FollowerEntity } from './follower.entity';

@Injectable()
export class FollowersServiceDb {
  constructor(
    @InjectRepository(FollowerEntity) private followerRepository: Repository<FollowerEntity>
  ) { }

  async insertFollower(follower: FollowerEntity) {
    this.followerRepository.save(follower)
  }

  async updateFollower(follower: FollowerEntity) {
    this.followerRepository.update(follower.id, follower)
  }

  async getFollowers(accountId: number): Promise<AccountEntity[] | any[]> {
    const followers = await this.followerRepository
      .createQueryBuilder('follower')
      .leftJoinAndSelect('follower.follower', 'account', 'follower.follower = account.id')
      .where('follower.following = :id', { id: accountId })
      .getMany()

    return followers.map(x => x.follower)
  }

  async getFollowing(accountId: number): Promise<AccountEntity[] | any[]> {
    const following = await this.followerRepository
      .createQueryBuilder('follower')
      .leftJoinAndSelect('follower.following', 'account', 'follower.following = account.id')
      .where('follower.follower = :id', { id: accountId })
      .getMany()

    return following.map(x => x.following)
  }
}
