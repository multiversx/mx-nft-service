import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { BaseProvider } from '../common/base.loader';
import { ArtistAddressRedisHandler } from './artists.redis-handler';
import { SmartContractArtistsService } from './smart-contract-artist.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArtistAddressProvider extends BaseProvider<string> {
  constructor(private smartContractArtistService: SmartContractArtistsService, accountsRedisHandler: ArtistAddressRedisHandler) {
    super(accountsRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  getData = async (keys: string[]): Promise<any[]> => {
    const uniqueAddresses = [...new Set(keys)];
    const scPromises = uniqueAddresses.map((address) => this.smartContractArtistService.getArtistForScAddress(address));

    const smartContractsResponse = await Promise.all(scPromises);
    return smartContractsResponse?.groupBy((item) => item.address);
  };
}
