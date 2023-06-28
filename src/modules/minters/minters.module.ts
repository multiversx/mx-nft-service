import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MintersMutationsResolver } from './minters-mutations.resolver';
import { MintersService } from './minters.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';
import { MintersCachingService } from './minters-caching.service';

@Module({
  providers: [MintersMutationsResolver, MintersService, MintersCachingService],
  imports: [
    PubSubListenerModule,
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuthModule),
  ],
  exports: [MintersService, MintersCachingService],
})
export class MintersModuleGraph {}
