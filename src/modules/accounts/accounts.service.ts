import { Injectable } from '@nestjs/common';
import { AccountEntity } from 'src/db/accounts/account.entity';
import { AccountsServiceDb } from '../../db/accounts/accounts.service';
import { FollowersServiceDb } from '../../db/followers/followers.service';
import { Account } from './models/account.dto';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Address } from '@elrondnetwork/erdjs';
import { Owner } from '../assets/models';
import { UpsertAccountArgs } from './models/UpsertAccountArgs';
import { FiltersExpression } from '../filtersTypes';
import { S3Service } from '../s3/s3-manager.service';
import { SocialLinkEntity } from 'src/db/socialLinks/social-link.entity';

@Injectable()
export class AccountsService {
  constructor(
    private accountsServiceDb: AccountsServiceDb,
    private followerServiceDb: FollowersServiceDb,
    private elrondProxyService: ElrondProxyService,
    private s3Service: S3Service,
  ) {}

  async upsertAccount(args: UpsertAccountArgs): Promise<Account | any> {
    let existingAccount = await this.accountsServiceDb.getAccountByAddress(
      args.address,
    );
    if (!existingAccount) {
      existingAccount = await this.getAccountFromBlockchain(args.address);
      existingAccount.creationDate = new Date(new Date().toUTCString());
    }
    const newAccount = {
      ...existingAccount,
      description: args.description ?? existingAccount?.description,
      address: args.address ?? existingAccount?.address,
      modifiedDate: new Date(new Date().toUTCString()),
    };
    newAccount.socialLinks = args.socialLinkIds.map(
      (i) => new SocialLinkEntity({ id: i }),
    );
    await this.uploadFiles(args, newAccount);
    return this.accountsServiceDb.saveAccount(newAccount);
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

  async getAccountFromBlockchain(address: string): Promise<Account | any> {
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

  async getSocialLinks(id: number): Promise<Account[] | any[]> {
    return await this.accountsServiceDb.getSocialLinks(id);
  }

  async getFollowers(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowers(id);
  }

  async getFollowing(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowing(id);
  }

  private async uploadFiles(args: UpsertAccountArgs, account: AccountEntity) {
    if (args.avatarFile) {
      const avatarUrl = await this.s3Service.upload(args.avatarFile);
      account.profileImgUrl = new URL(avatarUrl).pathname;
    }
    if (args.coverFile) {
      const coverUrl = await this.s3Service.upload(args.coverFile);
      account.coverImgUrl = new URL(coverUrl).pathname;
    }
  }

  private mapEntityToDto(account: AccountEntity): Account {
    return new Account({
      id: account.id,
      address: account.address,
      description: account.description,
      profileImgUrl: account.profileImgUrl,
      coverImgUrl: account.coverImgUrl,
      herotag: account.herotag,
    });
  }
}
