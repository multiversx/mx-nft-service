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

  async getAccountWithFollowers(id: number): Promise<Account | any> {
    const account = await this.accountsServiceDb.getAccountById(id)
    const followers = await this.followerServiceDb.getFollowers(id)
    const following = await this.followerServiceDb.getFollowing(id)

    const accountDto = new Account({
      id: account.id,
      address: account.address,
      profileImgUrl: account.profileImgUrl,
      herotag: account.herotag,
      followers: [],
      following: []
    })
    followers.forEach((f) => {
      accountDto.followers.push(new Account({
        id: f.id,
        address: f.address,
        profileImgUrl: f.profileImgUrl,
        herotag: f.herotag
      }))
    })
    following.forEach((f) => {
      accountDto.following.push(new Account({
        id: f.id,
        address: f.address,
        profileImgUrl: f.profileImgUrl,
        herotag: f.herotag
      }))
    })
    return accountDto
  }
}
