import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MintersMutationsResolver } from './minters-mutations.resolver';
import { MintersService } from './minters.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';
import { MintersCachingService } from './minters-caching.service';
import { MintersDeployerAbiService } from './minters-deployer.abi.service';
import { MintersQueriesResolver } from './minters-queries.resolver';

@Module({
  providers: [
    MintersMutationsResolver,
    MintersQueriesResolver,
    MintersService,
    MintersCachingService,
    MintersDeployerAbiService,
  ],
  imports: [PubSubListenerModule, MxCommunicationModule, CommonModule, forwardRef(() => AuthModule)],
  exports: [MintersService, MintersCachingService],
})
export class MintersModuleGraph {}
