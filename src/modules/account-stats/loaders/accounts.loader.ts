import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { ElrondIdentityService } from 'src/common';
import { BaseProvider } from '../../assets/base.loader';
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
    const accounts = await this.accountsService.getProfiles(keys);
    const accountsAddreses = accounts?.groupBy((a) => a.address);

    return accountsAddreses;
  };
}
