import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule, ElrondElasticService } from 'src/common';
import { CommonModule } from 'src/common.module';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { NftRarityModule } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticRarityUpdaterService } from './elastic-rarity.updater.service';

@Module({
  imports: [CommonModule, NftRarityModule],
  providers: [ElasticRarityUpdaterService],
})
export class ElasticRarityUpdaterModule {}
