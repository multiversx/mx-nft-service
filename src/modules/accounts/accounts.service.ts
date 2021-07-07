import { Injectable } from '@nestjs/common';
import { FollowersServiceDb } from '../../db/followers/followers.service';
import { Account } from './models/account.dto';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Address } from '@elrondnetwork/erdjs';
import { Owner } from '../assets/models';
import { FollowerEntity } from 'src/db/followers/follower.entity';

@Injectable()
export class AccountsService {
  constructor(
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
    return await this.followerServiceDb.insertFollower(
      new FollowerEntity({
        followingAddress: followAddress,
        followerAddress: address,
      }),
    );
  }

  async unfollow(address: string, followAddress: string): Promise<any> {
    return await this.followerServiceDb.deleteFollower(
      new FollowerEntity({
        followingAddress: followAddress,
        followerAddress: address,
      }),
    );
  }

  async getFollowers(address: string): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowers(address);
  }

  async getFollowing(address: string): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowing(address);
  }
}
