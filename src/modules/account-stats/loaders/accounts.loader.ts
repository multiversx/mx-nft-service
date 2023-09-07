import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { MxIdentityService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { AccountsRedisHandler } from './accounts.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AccountsProvider extends BaseProvider<string> {
  constructor(private accountsService: MxIdentityService, accountsRedisHandler: AccountsRedisHandler) {
    super(accountsRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  getData = async (keys: string[]): Promise<any[]> => {
    if (process.env.ENABLE_BATCH_ACCOUNT_GET === 'true') {
      return await this.getBatchAccountsQuery(keys);
    }
    return await this.getSingleAccountQuery(keys);
  };

  private async getBatchAccountsQuery(keys: string[]) {
    const accounts = await this.accountsService.getProfiles(keys);
    const accountsAddreses = accounts?.groupBy((a) => a.address);

    return accountsAddreses;
  }

  private async getSingleAccountQuery(keys: string[]): Promise<any[]> {
    const accountResponse = await this.accountsService.getAccountsForAddresses(keys);
    return accountResponse?.groupBy((item) => item.address);
  }
}
