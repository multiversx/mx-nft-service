import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { CollectionModuleGraph } from 'src/modules/nftCollections/collection.module';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityResolver } from './nft-rarity.resolver';
import { NftRarityService } from './nft-rarity.service';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([NftRarityRepository]),
    CollectionModuleGraph,
  ],
  providers: [NftRarityResolver, NftRarityService, NftRarityComputeService],
  exports: [],
})
export class NftRarityModule {}
