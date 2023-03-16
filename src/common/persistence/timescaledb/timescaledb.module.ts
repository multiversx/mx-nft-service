import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { CacheModule } from 'src/common/services/caching/caching.module';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';

import { AnalyticsDataGetterService } from './analytics-data.getter.service';
import { AnalyticsDataSetterService } from './analytics-data.setter.service';
import { XNftsAnalyticsEntity } from './entities/analytics.entity';

@Module({
  imports: [
    CommonModule,
    CacheModule,
    TypeOrmModule.forRootAsync({
      imports: [CommonModule],
      name: 'timescaledb',
      useFactory: (apiConfig: ApiConfigService) => ({
        autoLoadEntities: true,
        type: 'postgres',
        host: apiConfig.getTimescaleDbHost(),
        port: apiConfig.getTimescaleDbPort(),
        database: apiConfig.getTimescaleDbDatabase(),
        username: apiConfig.getTimescaleDbUsername(),
        password: apiConfig.getTimescaleDbPassword(),
        // ssl: true,
        // extra: {
        //   ssl: {
        //     rejectUnauthorized: false,
        //   },
        // },
        entities: [XNftsAnalyticsEntity],
      }),
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([XNftsAnalyticsEntity], 'timescaledb'),
  ],
  providers: [AnalyticsDataGetterService, AnalyticsDataSetterService],
  exports: [AnalyticsDataGetterService, AnalyticsDataSetterService],
})
export class TimescaleDbModule {}
