import { NestFactory } from '@nestjs/core';
import BigNumber from 'bignumber.js';
import { AnalyticsService } from './modules/analytics/analytics.service';
import { AnalyticsModule } from './modules/analytics/analytics.module';

export async function run(startDateUtc: string, endDateUtc: string) {
  BigNumber.config({ EXPONENTIAL_AT: [-100, 100] });
  const app = await NestFactory.create(AnalyticsModule);
  const analyticsService = app.get<AnalyticsService>(AnalyticsService);
  await analyticsService.indexAnalyticsLogs(parseInt(startDateUtc), parseInt(endDateUtc));
  return process.exit(0);
}

run(process.argv[2], process.argv[3]);
