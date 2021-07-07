import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { CollectionsResolver } from './collection.resolver';
import { CollectionsService } from './collection.service';
import { AssetsModuleGraph } from '../assets/assets.module';

@Module({
  providers: [CollectionsService, CollectionsResolver],
  imports: [ElrondCommunicationModule, AssetsModuleGraph],
  exports: [CollectionsService],
})
export class CollectionModuleGraph {}
