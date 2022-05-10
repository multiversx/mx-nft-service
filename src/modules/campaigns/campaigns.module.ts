import { Module } from '@nestjs/common';
import { CampaignsQueriesResolver } from './campaigns-queries.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { CampaignsMutationsResolver } from './campaigns-mutations.resolver';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsRepository } from 'src/db/campaigns/campaigns.repository';
import { TiersRepository } from 'src/db/campaigns/tiers.repository';
import { CampaignsService } from './campaigns.service';

@Module({
  providers: [
    CampaignsMutationsResolver,
    CampaignsQueriesResolver,
    NftMinterAbiService,
    CampaignsService,
  ],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([CampaignsRepository]),
    TypeOrmModule.forFeature([TiersRepository]),
  ],
  exports: [CampaignsService],
})
export class CampaignsModuleGraph {}
