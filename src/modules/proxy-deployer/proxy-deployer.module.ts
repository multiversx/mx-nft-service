import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { ProxyDeployerMutationsResolver } from './proxy-deployer-mutations.resolver';
import { MintersService } from './proxy-deployer.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';
import { MintersCachingService } from './proxy-deployer-caching.service';
import { ProxyDeployerAbiService } from './proxy-deployer.abi.service';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';

@Module({
  providers: [ProxyDeployerMutationsResolver, MintersService, MintersCachingService, ProxyDeployerAbiService],
  imports: [PubSubListenerModule, MxCommunicationModule, CommonModule, forwardRef(() => AuthModule), CacheEventsPublisherModule],
  exports: [MintersService, MintersCachingService],
})
export class ProxyDeployerModuleGraph {}
