import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MintersMutationsResolver } from './minters-mutations.resolver';
import { MintersService } from './minters.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [MintersMutationsResolver, MintersService],
  imports: [
    PubSubListenerModule,
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuthModule),
  ],
  exports: [MintersService],
})
export class MintersModuleGraph {}
