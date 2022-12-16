import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiConfigService } from 'src/utils/api.config.service';
import { rabbitExchanges } from '../../rabbit-config';
import { CommonRabbitModule } from '../common-rabbitmq.module';
import { CacheEventsPublisherService } from './change-events-publisher.service';

function getImports() {
  const apiConfigService = new ApiConfigService(new ConfigService());

  let imports: any = [];

  if (!apiConfigService.isIndexerInstance()) {
    imports.push(
      CommonRabbitModule.register(() => {
        return {
          exchange: rabbitExchanges.CACHE_INVALIDATION,
          uri: apiConfigService.getCommonRabbitMqUrl(),
        };
      }),
    );
  }

  return imports;
}
const imports = getImports();

@Global()
@Module({
  imports: imports,
  providers: [CacheEventsPublisherService],
  exports: [CacheEventsPublisherService],
})
export class CacheEventsPublisherModule {}
