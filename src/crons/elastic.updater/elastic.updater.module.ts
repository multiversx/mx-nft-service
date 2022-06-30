import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { NftRarityModule } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticUpdaterService } from './elastic.updater.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([NftsFlagsRepository]),
    NftRarityModule,
  ],
  providers: [ElasticUpdaterService],
})
export class ElasticUpdaterModule {}
