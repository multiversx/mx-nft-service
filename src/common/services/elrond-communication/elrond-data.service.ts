import { Injectable } from '@nestjs/common';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
const axios = require('axios');

@Injectable()
export class ElrondDataService {
  constructor() {}

  async getQuotesHistoricalTimestamp(timestamp: number): Promise<number> {
    const url = `${process.env.ELROND_DATA}/closing/quoteshistorical/egld/price/${timestamp}`;
    const profiler = new PerformanceProfiler(
      `getQuotesHistoricalTimestamp ${url}`,
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
      console.log(error);
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
      console.log(error);
      return;
    }
  }
}
