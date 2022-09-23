import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { ElrondApiService } from 'src/common';
import { BaseProvider } from '../common/base.loader';
import { ArtistAddressRedisHandler } from './artists.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArtistAddressProvider extends BaseProvider<string> {
  constructor(
    private elrondApiService: ElrondApiService,
    accountsRedisHandler: ArtistAddressRedisHandler,
  ) {
    super(
      accountsRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  getData = async (keys: string[]): Promise<any[]> => {
    const uniqueAddresses = [...new Set(keys)];
    const accountsPromises = uniqueAddresses.map((address) =>
      this.elrondApiService.getSmartContractOwner(address),
    );

    const accountResponse = await Promise.all(accountsPromises);
    return accountResponse?.groupBy((item) => item.address);
  };
}
