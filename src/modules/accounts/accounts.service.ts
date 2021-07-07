import { Inject, Injectable } from '@nestjs/common';
import { FollowersServiceDb } from '../../db/followers/followers.service';
import { Account } from './models/account.dto';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Address } from '@elrondnetwork/erdjs';
import { Owner } from '../assets/models';
import { FollowerEntity } from 'src/db/followers/follower.entity';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class AccountsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private followerServiceDb: FollowersServiceDb,
    private elrondProxyService: ElrondProxyService,
  ) {}

  async getAccountByAddress(address: string): Promise<Account | any> {
    const networkAccount = await this.elrondProxyService
      .getService()
      .getAccount(new Address(address));

    return new Account({
      address: networkAccount.address.bech32(),
      herotag: networkAccount.userName,
    });
  }

  async getOwnerByAddress(address: string): Promise<Owner | any> {
    let owner = new Owner();
    owner.account = (await this.getAccountByAddress(address)) || null;
    return owner;
  }

  async follow(address: string, followAddress: string): Promise<any> {
    try {
      const follower = await this.followerServiceDb.insertFollower(
        new FollowerEntity({
          followingAddress: followAddress,
          followerAddress: address,
        }),
      );
      console.log(follower);
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

  async getFollowers(address: string): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowers(address);
  }

  async getFollowing(address: string): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowing(address);
  }
}
