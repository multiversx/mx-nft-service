import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { AdminOperationsModuleGraph } from 'src/modules/admins/admin-operations.module';
import { NftRarityModule } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticNsfwUpdaterService } from './elastic-nsfw.updater.service';

@Module({
  imports: [CommonModule, AdminOperationsModuleGraph, NftRarityModule],
  providers: [ElasticNsfwUpdaterService],
})
export class ElasticNsfwUpdaterModule {}
