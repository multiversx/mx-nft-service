import { Injectable } from '@nestjs/common';
import { AccountEntity } from 'src/db/accounts/account.entity';
import { AccountsServiceDb } from '../../db/accounts/accounts.service';
import { FollowersServiceDb } from '../../db/followers/followers.service';
import { Account } from './models/account.dto';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Address } from '@elrondnetwork/erdjs';
import { Owner } from '../assets/models';
import { CreateAccountArgs } from './models/CreateAccountArgs';
import { FiltersExpression } from '../filtersTypes';
import { S3Service } from '../s3/s3-manager.service';

@Injectable()
export class AccountsService {
  constructor(
    private accountsServiceDb: AccountsServiceDb,
    private followerServiceDb: FollowersServiceDb,
    private elrondProxyService: ElrondProxyService,
    private s3Service: S3Service,
  ) {}

  async createAccount(args: CreateAccountArgs): Promise<Account | any> {
    let account = new AccountEntity({
      address: args.address,
      herotag: args.herotag,
      description: args.description,
    });
    await this.uploadFiles(args, account);
    return await this.accountsServiceDb.insertAccount(account);
  }

  private async uploadFiles(args: CreateAccountArgs, account: AccountEntity) {
    if (args.avatarFile) {
      console.log('avatarFile');
      account.profileImgUrl = await this.s3Service.upload(args.avatarFile);
    }
    if (args.coverFile) {
      account.coverImgUrl = await this.s3Service.upload(args.coverFile);
    }
  }

  async updateAccount(args: CreateAccountArgs): Promise<Account | any> {
    const existingAccount = await this.accountsServiceDb.getAccountByAddress(
      args.address,
    );
    const newAccount = new AccountEntity({
      herotag: args.herotag ? args.herotag : existingAccount.herotag,

      address: args.address ? args.address : existingAccount.address,
      description: args.description
        ? args.description
        : existingAccount.description,
    });
    await this.uploadFiles(args, newAccount);

    if (existingAccount) {
      newAccount.id = existingAccount.id;
      return this.accountsServiceDb.updateAccount(newAccount);
    }
    return this.accountsServiceDb.insertAccount(newAccount);
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
