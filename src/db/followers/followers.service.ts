import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowerEntity } from './follower.entity';

@Injectable()
export class FollowersServiceDb {
  constructor(
    @InjectRepository(FollowerEntity)
    private followerRepository: Repository<FollowerEntity>,
  ) {}

  async insertFollower(follower: FollowerEntity) {
    this.followerRepository.save(follower);
  }

  async deleteFollower(follower: FollowerEntity) {
    this.followerRepository.delete(follower);
  }

  async getFollowers(followerAddress: string): Promise<any[]> {
    const followers = await this.followerRepository.findAndCount({
      where: [{ followingAddress: followerAddress }],
    });

    return followers;
  }

  async getFollowing(followingAddress: string): Promise<any[]> {
    const following = await this.followerRepository.findAndCount({
      where: [{ followerAddress: followingAddress }],
    });

    return following;
  }
}
