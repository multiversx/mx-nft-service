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
  ): Promise<AccountStatsEntity> {
    if (isOwner) {
      return this.getStatsForOwner(address);
    } else return this.getPublicStats(address);
  }

  private async getPublicStats(address: string): Promise<AccountStatsEntity> {
    try {
      return this.accountStatsCachingService.getPublicStats(address, () =>
        this.accountsStatsRepository.getPublicAccountStats(address),
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

  private async getStatsForOwner(address: string): Promise<AccountStatsEntity> {
    try {
      return this.accountStatsCachingService.getStatsForOwner(address, () =>
        this.accountsStatsRepository.getOnwerAccountStats(address),
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting stats for owner account',
        {
          path: 'AccountsStatsService.getStatsForOwner',
          address,
          exception: err?.message,
        },
      );
      return new AccountStatsEntity();
    }
  }

  async getClaimableCount(address: string): Promise<number> {
    try {
      return this.accountStatsCachingService.getClaimableCount(address, () =>
        this.accountsStatsRepository.getAccountClaimableCount(address),
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
