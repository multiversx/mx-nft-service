import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { Logger } from 'winston';
import { AccountIdentity } from './models/account.identity';
const axios = require('axios');

@Injectable()
export class ElrondIdentityService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getProfiles(addresses: string[]): Promise<AccountIdentity[]> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/users/multiple`;
    const profiler = new PerformanceProfiler(`getProfiles ${url}`);

    let request: any = { addresses: addresses };

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
        accounts[key] = { ...accounts[key], address: key };
        return accounts[key];
      });
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond api service on url ${url}`,
        {
          path: 'ElrondIdentityService.getProfiles',
          addresses: addresses,
          exception: error.toString(),
        },
      );
      return;
    }
  }
}
