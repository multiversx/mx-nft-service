import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { VerifyContentService } from 'src/modules/assets/verify-content.service';
import { NftRarityModule } from 'src/modules/nft-rarity/nft-rarity.module';
import { FlagNftService } from 'src/modules/report-nfts/flag-nft.service';
import { ElasticUpdaterService } from './elastic.updater.service';

@Module({
  imports: [
    CommonModule,
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([NftsFlagsRepository]),
    NftRarityModule,
  ],
  providers: [ElasticUpdaterService, FlagNftService, VerifyContentService],
})
export class ElasticUpdaterModule {}
