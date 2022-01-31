import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondIdentityService, RedisCacheService } from 'src/common';
import { BaseProvider } from '../assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AccountsProvider extends BaseProvider<string> {
  constructor(
    private accountsService: ElrondIdentityService,
    redisCacheService: RedisCacheService,
  ) {
    super(
      'account',
      redisCacheService,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
      15,
    );
  }

  getDataFromDb = async (keys: string[]): Promise<any[]> => {
    const accounts = await this.accountsService.getProfiles(keys);
    const accountsAddreses = accounts?.groupBy((a) => a.address);

    return accountsAddreses;
  };

  mapValuesForRedis(
    addresses: string[],
    accountsAddreses: { [key: string]: any[] },
  ) {
    return addresses.map((address) => {
      return accountsAddreses[address] ? accountsAddreses[address][0] : null;
    });
  }
}
