import { Injectable, Logger } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { CachingService } from '@elrondnetwork/erdnest';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { XOXNO_MINTING_MANAGER } from 'src/utils/constants';

@Injectable()
export class SmartContractArtistsService {
  constructor(
    private cachingService: CachingService,
    private mxApiService: MxApiService,
    private logger: Logger,
  ) {}

  async getOrSetArtistForScAddress(address: string) {
    return this.cachingService.getOrSetCache(
      `${CacheInfo.Artist.key}_${address}`,
      async () => this.getMappedArtistForScAddress(address),
      CacheInfo.Artist.ttl,
    );
  }

  public async getMappedArtistForScAddress(
    scAddress: string,
  ): Promise<{ key: string; value: { address: string; owner: string } }> {
    const account = await this.getArtistForScAddress(scAddress);

    return { key: account.address, value: account };
  }

  public async getArtistForScAddress(
    scAddress: string,
  ): Promise<{ address: string; owner: string }> {
    const account = await this.mxApiService.getSmartContractOwner(scAddress);
    if (account.owner === XOXNO_MINTING_MANAGER) {
      return await this.getXoxnoMinterOwner(scAddress);
    }
    return account;
  }

  private async getXoxnoMinterOwner(
    scAddress: string,
  ): Promise<{ address: string; owner: string }> {
    const xoxnoScCount = await this.getOrSetXoxnoScCount(XOXNO_MINTING_MANAGER);
    const smartContracts = await this.mxApiService.getAccountSmartContracts(
      XOXNO_MINTING_MANAGER,
      xoxnoScCount,
    );

    const selectedContract = smartContracts.find(
      (c) => c.address === scAddress,
    );
    if (selectedContract) {
      const transaction = await this.mxApiService.getTransactionByHash(
        selectedContract.deployTxHash,
      );
      return {
        address: scAddress,
        owner: transaction.sender.bech32(),
      };
    }
    this.logger.log(`Contract not found for ${scAddress}`);
    return {
      address: scAddress,
      owner: scAddress,
    };
  }

  private async getOrSetXoxnoScCount(address: string) {
    return this.cachingService.getOrSetCache(
      CacheInfo.XoxnoScCount.key,
      async () => this.mxApiService.getAccountSmartContractsCount(address),
      CacheInfo.XoxnoScCount.ttl,
    );
  }
}
