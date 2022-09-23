import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { ElrondIdentityService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { AccountsRedisHandler } from './accounts.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AccountsProvider extends BaseProvider<string> {
  constructor(
    private accountsService: ElrondIdentityService,
    accountsRedisHandler: AccountsRedisHandler,
  ) {
    super(
      accountsRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  getData = async (keys: string[]): Promise<any[]> => {
    if (process.env.ENABLE_BATCH_ACCOUNT_GET === 'true') {
      return await this.getBatchAccountsQuery(keys);
    }
    return await this.getSingleAccountQuery(keys);
  };

  private async getBatchAccountsQuery(keys: string[]) {
    const accounts = await this.accountsService.getProfiles(keys);
    const accountsAddreses = accounts?.groupBy((a) => a.address, false);

    return accountsAddreses;
  }

  private async getSingleAccountQuery(keys: string[]): Promise<any[]> {
    const uniqueAddresses = [...new Set(keys)];
    const accountsPromises = uniqueAddresses.map((address) =>
      this.accountsService.getProfile(address),
    );

    const accountResponse = await Promise.all(accountsPromises);
    return accountResponse?.groupBy((item) => item.address, false);
  }
}
