import { Injectable } from '@nestjs/common';
import { AccountEntity } from 'src/db/accounts/account.entity';
import { AccountsServiceDb } from '../../db/accounts/accounts.service';
import { FollowersServiceDb } from '../../db/followers/followers.service';
import { Account } from './models/account.dto';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Address } from '@elrondnetwork/erdjs';
import { Owner } from '../assets/models';
import { CreateAccountArgs } from './CreateAccountArgs';
import { FiltersExpression } from '../filtersTypes';

@Injectable()
export class AccountsService {
  constructor(
    private accountsServiceDb: AccountsServiceDb,
    private followerServiceDb: FollowersServiceDb,
    private elrondProxyService: ElrondProxyService,
  ) {}

  async createAccount(args: CreateAccountArgs): Promise<Account | any> {
    return await this.accountsServiceDb.insertAccount(
      new AccountEntity({
        address: args.address,
        profileImgUrl: args.profileImgUrl,
        herotag: args.herotag,
        description: args.description,
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

  async getAccounts(
    limit: number = 50,
    offset: number,
    filters: FiltersExpression,
  ): Promise<[any[], number]> {
    const [accounts, count] = await this.accountsServiceDb.getAccounts(
      limit,
      offset,
      filters,
    );
    let responseAccounts: Account[] = [];
    accounts.forEach((account) => {
      responseAccounts.push(this.mapEntityToDto(account));
    });

    return [responseAccounts, count];
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

  async getOwnerByAddress(address: string): Promise<Owner | any> {
    let owner = new Owner();
    owner.account = (await this.getAccountByAddress(address)) || null;
    return owner;
  }

  async getFollowers(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowers(id);
  }

  async getFollowing(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowing(id);
  }

  private mapEntityToDto(account: AccountEntity): Account {
    return new Account({
      id: account.id,
      address: account.address,
      description: account.description,
      profileImgUrl: account.profileImgUrl,
      herotag: account.herotag,
    });
  }
}
