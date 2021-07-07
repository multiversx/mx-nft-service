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
    try {
      return await this.followerRepository.save(follower);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === 1062) {
        return null;
      }
      throw err;
    }
  }

  async deleteFollower(unfollowAddress: string, address: string) {
    try {
      return await this.followerRepository.delete({
        followingAddress: unfollowAddress,
        followerAddress: address,
      });
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === 1062) {
        return null;
      }
      throw err;
    }
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
