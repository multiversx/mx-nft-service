import { Inject, Injectable } from '@nestjs/common';
import { FollowersServiceDb } from '../../db/followers/followers.service';
import { Account } from './models/Account.dto';
import { FollowerEntity } from 'src/db/followers/follower.entity';
import { Logger } from 'winston';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import * as Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class AccountsService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private followerServiceDb: FollowersServiceDb,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async follow(address: string, followAddress: string): Promise<any> {
    try {
      this.invalidateFollowersKey(followAddress);
      this.invalidateFollowingKey(address);
      const follower = await this.followerServiceDb.insertFollower(
        new FollowerEntity({
          followingAddress: followAddress,
          followerAddress: address,
        }),
      );
      return !!follower;
    } catch (err) {
      this.logger.error('An error occurred while adding Follower.', {
        path: 'AccountsService.follow',
        address,
        followAddress,
        err,
      });
      return false;
    }
  }

  async unfollow(address: string, unfollowAddress: string): Promise<any> {
    try {
      await this.followerServiceDb.deleteFollower(unfollowAddress, address);
      return true;
    } catch (err) {
      this.logger.error('An error occurred while removing Follower.', {
        path: 'AccountsService.follow',
        address,
        unfollowAddress,
        err,
      });
      return false;
    }
  }

  async getFollowers(
    address: string,
    offset: number,
    limit: number,
  ): Promise<[FollowerEntity[], number]> {
    try {
      const cacheKey = this.getFollowersCacheKey(address, offset, limit);
      const getIsAssetLiked = () =>
        this.followerServiceDb.getFollowers(address, offset, limit);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getIsAssetLiked,
        cacheConfig.assetsttl,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting all followers', {
        path: 'AccountsService.getFollowers',
        address,
      });
      return Promise.resolve([[], 0]);
    }
  }

  async getFollowing(
    address: string,
    offset: number,
    limit: number,
  ): Promise<[FollowerEntity[], number]> {
    try {
      const cacheKey = this.getFollowingCacheKey(address, offset, limit);
      const getIsAssetLiked = () =>
        this.followerServiceDb.getFollowing(address, offset, limit);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getIsAssetLiked,
        cacheConfig.assetsttl,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting all following', {
        path: 'AccountsService.getFollowing',
        address,
      });
      return Promise.resolve([[], 0]);
    }
  }

  private getFollowersCacheKey(
    identifier: string,
    offset: number,
    limit: number,
  ) {
    return generateCacheKeyFromParams('followers', identifier, offset, limit);
  }

  private getFollowingCacheKey(
    identifier: string,
    offset: number,
    limit: number,
  ) {
    return generateCacheKeyFromParams('following', identifier, offset, limit);
  }

  private async invalidateFollowersKey(address: string): Promise<void> {
    const cacheKey = generateCacheKeyFromParams('followers', address);
    return await this.redisCacheService.delByPattern(
      this.redisClient,
      `${cacheKey}_*`,
    );
  }

  private async invalidateFollowingKey(address: string): Promise<void> {
    const cacheKey = generateCacheKeyFromParams('following', address);
    return await this.redisCacheService.delByPattern(
      this.redisClient,
      `${cacheKey}_*`,
    );
  }
}
