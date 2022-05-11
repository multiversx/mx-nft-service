import { Module } from '@nestjs/common';
import { CampaignsQueriesResolver } from './campaigns-queries.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { CampaignsMutationsResolver } from './campaigns-mutations.resolver';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsRepository } from 'src/db/campaigns/campaigns.repository';
import { TiersRepository } from 'src/db/campaigns/tiers.repository';
import { CampaignsService } from './campaigns.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';

@Module({
  providers: [
    CampaignsMutationsResolver,
    CampaignsQueriesResolver,
    NftMinterAbiService,
    CampaignsService,
  ],
  imports: [
    PubSubListenerModule,
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([CampaignsRepository]),
    TypeOrmModule.forFeature([TiersRepository]),
  ],
  exports: [CampaignsService],
})
export class CampaignsModuleGraph {}
