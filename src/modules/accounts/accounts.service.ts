import { Injectable } from "@nestjs/common";
import { AccountEntity } from "src/db/accounts/account.entity";
import { AccountsServiceDb } from "../../db/accounts/accounts.service";
import { FollowersServiceDb } from "../../db/followers/followers.service";
import { Account } from "../nfts/dto/account.dto";

@Injectable()
export class AccountsService {
  constructor(
    private accountsServiceDb: AccountsServiceDb,
    private followerServiceDb: FollowersServiceDb
  ) { }

  async createAccount(
    address: string,
    profileImgUrl: string,
    herotag: string
  ): Promise<void> {
    await this.accountsServiceDb.insertAccount(new AccountEntity({
      address: address,
      profileImgUrl: profileImgUrl,
      herotag
    }))
  }

  async updateAccount(
    profileImgUrl: string
  ): Promise<void> {
    await this.accountsServiceDb.updateAccount(new AccountEntity({
      profileImgUrl: profileImgUrl
    }))
  }

  async getAccountById(id: number): Promise<Account | any> {
    return await this.accountsServiceDb.getAccountById(id)
  }

  async getAccountByAddress(address: string): Promise<Account | any> {
    return await this.accountsServiceDb.getAccountByAddress(address)
  }

  async getFollowers(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowers(id)
  }

  async getFollowing(id: number): Promise<Account[] | any[]> {
    return await this.followerServiceDb.getFollowing(id)
  }
}
