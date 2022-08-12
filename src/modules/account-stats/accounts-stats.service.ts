import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { AssetsQuery } from '../assets';
import { AccountsStatsCachingService } from './accounts-stats.caching.service';

@Injectable()
export class AccountsStatsService {
  constructor(
    private accountsStatsRepository: AccountStatsRepository,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private accountStatsCachingService: AccountsStatsCachingService,
  ) {}

  async getStats(
    address: string,
    isOwner: boolean,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    if (isOwner) {
      return this.getStatsForOwner(address, marketplaceKey);
    } else return this.getPublicStats(address, marketplaceKey);
  }

  private async getPublicStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    try {
      const key = marketplaceKey ? `${address}_${marketplaceKey}` : address;
      return this.accountStatsCachingService.getPublicStats(key, () =>
        this.accountsStatsRepository.getPublicAccountStats(
          address,
          marketplaceKey,
        ),
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting stats for public account',
        {
          path: 'AccountsStatsService.getPublicStats',
          address,
          exception: err?.message,
        },
      );
      return new AccountStatsEntity();
    }
  }

  private async getStatsForOwner(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    try {
      const key = marketplaceKey ? `${address}_${marketplaceKey}` : address;
      return this.accountStatsCachingService.getStatsForOwner(key, () =>
        this.accountsStatsRepository.getOnwerAccountStats(
          address,
          marketplaceKey,
        ),
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting stats for owner account',
        {
          path: 'AccountsStatsService.getStatsForOwner',
          address,
          marketplaceKey,
          exception: err?.message,
        },
      );
      return new AccountStatsEntity();
    }
  }

  async getClaimableCount(
    address: string,
    marketplaceKey: string = null,
  ): Promise<number> {
    try {
      const key = marketplaceKey ? `${address}_${marketplaceKey}` : address;
      return this.accountStatsCachingService.getClaimableCount(key, () =>
        this.accountsStatsRepository.getAccountClaimableCount(
          address,
          marketplaceKey,
        ),
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting claimable count for account',
        {
          path: 'AccountsStatsService.getClaimableCount',
          address,
          exception: err?.message,
        },
      );
      return 0;
    }
  }

  async getCollectedCount(address: string): Promise<number> {
    try {
      const query = new AssetsQuery().build();
      return this.accountStatsCachingService.getCollectedCount(address, () =>
        this.apiService.getNftsForUserCount(address, query),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting collected count', {
        path: 'AccountsStatsService.getCollectedCount',
        address,
        exception: err?.message,
      });
      return 0;
    }
  }

  async getCollectionsCount(address: string): Promise<number> {
    try {
      return this.accountStatsCachingService.getCollectionsCount(address, () =>
        this.apiService.getCollectionsForAddressCount(
          address,
          '?type=SemiFungibleESDT,NonFungibleESDT',
        ),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting collections Count ', {
        path: 'AccountsStatsService.getCollectionsCount',
        address,
        exception: err?.message,
      });
      return 0;
    }
  }

  async getCreationsCount(address: string): Promise<any> {
    try {
      const query = new AssetsQuery().addCreator(address).build();
      return this.accountStatsCachingService.getCreationsCount(address, () =>
        this.apiService.getNftsCount(query),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting creations count', {
        path: 'AccountsStatsService.getCreationsCount',
        address,
        exception: err?.message,
      });
      return new AccountStatsEntity();
    }
  }
}
