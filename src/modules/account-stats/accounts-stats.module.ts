import { Module } from '@nestjs/common';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountStatsRepository } from 'src/db/assets/account-stats.repository';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [AccountsStatsService, AccountsStatsResolver, RedisCacheService],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([AccountStatsRepository]),
  ],
  exports: [RedisCacheService],
})
export class AccountsStatsModuleGraph {}
