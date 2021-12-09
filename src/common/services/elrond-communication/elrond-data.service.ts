import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { Logger } from 'winston';
import { ApiService } from '../api.service';
const axios = require('axios');

@Injectable()
export class ElrondDataService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async getQuotesHistoricalTimestamp(timestamp: number): Promise<number> {
    const url = `${process.env.ELROND_DATA}/closing/quoteshistorical/egld/price/${timestamp}`;
    const profiler = new PerformanceProfiler(
      `getQuotesHistoricalTimestamp ${url}`,
    );

    try {
      let { data } = await this.apiService.get(url);

      profiler.stop();

      MetricsCollector.setExternalCall(
        ElrondDataService.name,
        'getQuotesHistoricalTimestamp',
        profiler.duration,
      );

      return data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond data service on url ${url}`,
        {
          path: `ElrondDataService.${ElrondDataService.name}`,
          error,
        },
      );
      return;
    }
  }

  async getQuotesHistoricalLatest(): Promise<number> {
    const url = `${process.env.ELROND_DATA}/latest/quoteshistorical/egld/price`;
    const profiler = new PerformanceProfiler(
      `getQuotesHistoricalLatest ${url}`,
    );

    try {
      let { data } = await axios.get(url, {
        timeout: 10000,
      });

      profiler.stop();

      MetricsCollector.setExternalCall(
        ElrondDataService.name,
        'getQuotesHistoricalTimestamp',
        profiler.duration,
      );

      return data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond data service on url ${url}`,
        {
          path: `ElrondDataService.${ElrondDataService.name}`,
          error,
        },
      );
      return;
    }
  }
}
