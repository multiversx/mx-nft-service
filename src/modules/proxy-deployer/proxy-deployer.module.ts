import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { ProxyDeployerMutationsResolver } from './proxy-deployer-mutations.resolver';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';
import { ProxyDeployerAbiService } from './proxy-deployer.abi.service';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';

@Module({
  providers: [ProxyDeployerMutationsResolver, ProxyDeployerAbiService],
  imports: [PubSubListenerModule, MxCommunicationModule, CommonModule, forwardRef(() => AuthModule), CacheEventsPublisherModule],
  exports: [],
})
export class ProxyDeployerModuleGraph {}
