import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AssetsLikesRepository } from 'src/db/assets/assets-likes.repository';
import { PersistenceService } from './persistance.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AssetsLikesRepository])],
  providers: [PersistenceService, AccountStatsRepository],
  exports: [PersistenceService],
})
export class PersistenceModule {}
