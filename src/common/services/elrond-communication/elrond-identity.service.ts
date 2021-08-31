import { Injectable } from '@nestjs/common';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
const axios = require('axios');

@Injectable()
export class ElrondIdentityService {
  constructor() {}

  async getProfiles(file: string[]): Promise<any> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/users/multiple`;

    const profiler = new PerformanceProfiler(`getProfiles ${url}`);

    let request: any = { addresses: file };

    try {
      let response = await axios.post(url, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      profiler.stop();

      MetricsCollector.setExternalCall(
        ElrondIdentityService.name,
        'getProfiles',
        profiler.duration,
      );
      const accounts = response.data.info;
      return Object.keys(accounts).map(function (key, index) {
        return accounts[key];
      });
    } catch (error) {
      console.log(error);
      return;
    }
  }
}
