import { Module } from '@nestjs/common';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';

@Module({
  providers: [
    AccountsStatsService,
    AccountsStatsResolver,
    RedisCacheService,
    LocalCacheService,
  ],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([AccountStatsRepository]),
  ],
  exports: [RedisCacheService, AccountsStatsService, LocalCacheService],
})
export class AccountsStatsModuleGraph {}
