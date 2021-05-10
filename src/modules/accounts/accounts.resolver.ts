import { Account } from "../nfts/dto/account.dto";
import { AccountEntity } from "src/db/accounts/account.entity";
import { FollowerEntity } from "src/db/followers/follower.entity";
import { Mutation, Query, Resolver, Args } from "@nestjs/graphql";
import { AccountsService } from "./accounts.service";
import { AccountsServiceDb } from "src/db/accounts/accounts.service";
import { FollowersServiceDb } from "src/db/followers/followers.service";

@Resolver()
export class AccountsResolver {
  constructor(
    private accountsServiceDb: AccountsServiceDb,
    private followerServiceDb: FollowersServiceDb,
    private accountsService: AccountsService,
  ) { }

  @Mutation(() => Account)
  async createAccount(
    @Args('address') address: string,
    @Args('profileImgUrl') profileImgUrl: string,
    @Args('herotag') herotag: string
  ): Promise<void> {
    return this.accountsService.createAccount(
      address,
      profileImgUrl,
      herotag
    )
  }

  @Mutation(() => Account)
  async updateAccount(
    @Args('profileImgUrl') profileImgUrl: string,
  ): Promise<void> {
    return this.accountsService.updateAccount(
      profileImgUrl,
    )
  }

  @Query(() => Account)
  async getAccountById(
    @Args('id') id: number
  ): Promise<Account> {
    return this.accountsService.getAccountById(id)
  }

  @Query(() => Account)
  async getAccountByAddress(
    @Args('address') address: string
  ): Promise<Account> {
    return this.accountsService.getAccountByAddress(address)
  }

  @Query(() => Account)
  async getAccountWithFollowing(
    @Args('id') id: number
  ): Promise<Account> {
    return await this.accountsService.getAccountWithFollowers(id)
  }

  @Query(() => Account)
  async addAccs(): Promise<Account> {
    const acc1 = new AccountEntity()
    acc1.address = "erd11"
    acc1.herotag = "user1"
    acc1.profileImgUrl = "url"
    acc1.creationDate = new Date()

    const acc2 = new AccountEntity()
    acc2.address = "erd12"
    acc2.herotag = "user2"
    acc2.profileImgUrl = "url"
    acc2.creationDate = new Date()

    const acc3 = new AccountEntity()
    acc3.address = "erd13"
    acc3.herotag = "user3"
    acc3.profileImgUrl = "url"
    acc3.creationDate = new Date()

    await this.accountsServiceDb.insertAccount(acc1)
    await this.accountsServiceDb.insertAccount(acc2)
    await this.accountsServiceDb.insertAccount(acc3)

    const r = new Account()
    return r
  }

  @Query(() => Account)
  async addFollow(): Promise<Account> {
    const acc1 = new AccountEntity()
    acc1.id = 1

    const acc2 = new AccountEntity()
    acc2.id = 2

    const acc3 = new AccountEntity()
    acc3.id = 3

    const follower1 = new FollowerEntity()
    follower1.follower = acc2
    follower1.following = acc1

    const follower2 = new FollowerEntity()
    follower2.follower = acc3
    follower2.following = acc1

    const follower3 = new FollowerEntity()
    follower3.follower = acc1
    follower3.following = acc3

    await this.followerServiceDb.insertFollower(follower1)
    await this.followerServiceDb.insertFollower(follower2)
    await this.followerServiceDb.insertFollower(follower3)

    const r = new Account()
    return r
  }

  @Query(() => Account)
  async get(): Promise<Account> {
    const smh = await this.followerServiceDb.getFollowers(1)
    console.log(smh)
    console.log(typeof (smh[0]))
    const acc = new Account()

    return acc
  }
}
