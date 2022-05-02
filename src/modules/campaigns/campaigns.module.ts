import { Module } from '@nestjs/common';

import { CampaignsQueriesResolver } from './campaigns-queries.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { CampaignsMutationsResolver } from './campaigns-mutations.resolver';
import { NftMinterAbiService } from './nft-minter.abi.service';

@Module({
  providers: [
    CampaignsMutationsResolver,
    CampaignsQueriesResolver,
    NftMinterAbiService,
  ],
  imports: [ElrondCommunicationModule],
  exports: [],
})
export class CampaignsModuleGraph {}
