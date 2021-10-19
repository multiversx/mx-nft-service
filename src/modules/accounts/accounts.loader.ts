import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { AccountIdentity, ElrondIdentityService } from 'src/common';

@Injectable({
  scope: Scope.Operation,
})
export class AccountsProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.batchAccounts(keys),
    { cache: false },
  );

  constructor(private accountsService: ElrondIdentityService) {}

  batchAccounts = async (keys: string[]) => {
    const accounts = await this.accountsService.getProfiles(keys);
    const accountsAddreses: { [key: string]: AccountIdentity[] } = {};

    accounts.forEach((account) => {
      if (!accountsAddreses[account.address]) {
        accountsAddreses[account.address] = [account];
      } else {
        accountsAddreses[account.address].push(account);
      }
    });
    let resp = keys.map((address) => accountsAddreses[address]);
    return resp;
  };

  async getAccountByAddress(userId: string): Promise<AccountIdentity> {
    const user = await this.dataLoader.load(userId);
    return user[0];
  }
}
