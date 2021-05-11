import { Injectable } from '@nestjs/common';
import { AccountEntity } from 'src/db/accounts/account.entity';
import { AccountsServiceDb } from '../../db/accounts/accounts.service';
import { FollowersServiceDb } from '../../db/followers/followers.service';
import { Account } from '../nfts/dto/account.dto';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Address } from '@elrondnetwork/erdjs';
import { Onwer } from '../nfts/dto/onwer.dto';

@Injectable()
export class AccountsService {
  constructor(
    private accountsServiceDb: AccountsServiceDb,
    private followerServiceDb: FollowersServiceDb,
    private elrondProxyService: ElrondProxyService,
  ) {}

  async createAccount(
    address: string,
    profileImgUrl: string,
    herotag: string,
  ): Promise<Account | any> {
    return await this.accountsServiceDb.insertAccount(
      new AccountEntity({
        address: address,
        profileImgUrl: profileImgUrl,
        herotag,
      }),
    );
  }

  async updateAccount(profileImgUrl: string): Promise<void> {
    await this.accountsServiceDb.updateAccount(
      new AccountEntity({
        profileImgUrl: profileImgUrl,
      }),
    );
  }

  async getAccountById(id: number): Promise<Account | any> {
    return await this.accountsServiceDb.getAccountById(id);
  }

  async getAccountByAddress(address: string): Promise<Account | any> {
    const account = await this.accountsServiceDb.getAccountByAddress(address);
    if (account !== undefined) {
      return account;
    }
    const networkAccount = await this.elrondProxyService
      .getService()
      .getAccount(new Address(address));

    return new Account({
      address: networkAccount.address.bech32(),
      herotag: networkAccount.userName,
    });
  }

  async getOwnerByAddress(address: string): Promise<Onwer | any> {
    let owner = new Onwer();
    owner.account = await this.accountsServiceDb.getAccountByAddress(address);
    return owner;
  }

  async getFollowers(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowers(id);
  }

  async getFollowing(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowing(id);
  }
}
