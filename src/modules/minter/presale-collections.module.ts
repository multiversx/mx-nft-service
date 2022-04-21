import { Module } from '@nestjs/common';

import { PresaleCollectionsQueriesResolver } from './presale-collections-queries.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { PresaleCollectionMutationsResolver } from './presale-collections-mutations.resolver';
import { NftMinterAbiService } from './nft-minter.abi.service';

@Module({
  providers: [
    PresaleCollectionMutationsResolver,
    PresaleCollectionsQueriesResolver,
    NftMinterAbiService,
  ],
  imports: [ElrondCommunicationModule],
  exports: [],
})
export class PresaleCollectionModuleGraph {}
