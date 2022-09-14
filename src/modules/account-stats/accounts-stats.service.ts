import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { AssetsQuery } from '../assets';
import { AccountsStatsCachingService } from './accounts-stats.caching.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class AccountsStatsService {
  constructor(
    private persistenceService: PersistenceService,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private accountStatsCachingService: AccountsStatsCachingService,
    private marketplacesService: MarketplacesService,
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
        this.persistenceService.getPublicAccountStats(address, marketplaceKey),
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
        this.persistenceService.getOnwerAccountStats(address, marketplaceKey),
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
        this.persistenceService.getAccountClaimableCount(
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

  async getCollectedCount(
    address: string,
    marketplaceKey: string = null,
  ): Promise<number> {
    try {
      const query = new AssetsQuery();
      if (marketplaceKey) {
        const collections =
          await this.marketplacesService.getCollectionsByMarketplace(
            marketplaceKey,
          );
        query.addCollections(collections).build();
      }
      return this.accountStatsCachingService.getCollectedCount(address, () =>
        this.apiService.getNftsForUserCount(address, query.build()),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting collected count', {
        path: 'AccountsStatsService.getCollectedCount',
        address,
        marketplaceKey,
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
