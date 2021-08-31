import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondIdentityService } from 'src/common';

@Injectable({
  scope: Scope.Operation,
})
export class AccountsProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.accountsService.getProfiles(keys),
  );

  constructor(private accountsService: ElrondIdentityService) {}

  async getAccountByAddress(userId: string): Promise<any> {
    return await this.dataLoader.load(userId);
  }
}
