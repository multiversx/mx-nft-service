import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { CacheModule } from 'src/common/services/caching/caching.module';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';
import {
  XNftsAnalyticsEntity,
  SumDaily,
  SumHourly,
  CloseDaily,
  CloseHourly,
} from 'src/timescaledb/entities/analytics.entities';
import { AnalyticsDataGetterService } from './analytics-data.getter.service';
import { AnalyticsDataSetterService } from './analytics-data.setter.service';

@Module({
  imports: [
    CommonModule,
    CacheModule,
    TypeOrmModule.forRootAsync({
      imports: [CommonModule],
      useFactory: (apiConfig: ApiConfigService) => ({
        type: 'postgres',
        host: apiConfig.getTimescaleDbHost(),
        port: apiConfig.getTimescaleDbPort(),
        database: apiConfig.getTimescaleDbDatabase(),
        username: apiConfig.getTimescaleDbUsername(),
        password: apiConfig.getTimescaleDbPassword(),
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
        entities: ['dist/**/*.entities.{ts,js}'],
      }),
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([
      XNftsAnalyticsEntity,
      SumDaily,
      SumHourly,
      CloseDaily,
      CloseHourly,
    ]),
  ],
  providers: [AnalyticsDataGetterService, AnalyticsDataSetterService],
  exports: [AnalyticsDataGetterService, AnalyticsDataSetterService],
})
export class TimescaleDbModule {}
