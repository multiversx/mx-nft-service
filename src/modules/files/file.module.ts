import { CacheModule, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { CacheManagerModule } from '../../common/services/cache-manager/cache-manager.module';
import * as redisStore from 'cache-manager-redis-store';
import { FileService } from './file.service';

@Module({
  providers: [FileService],
  imports: [
    ElrondCommunicationModule,
    CacheManagerModule,
    CacheModule.register({
      ttl: 30,
      store: redisStore,
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      prefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [FileService],
})
export class FileModule { }