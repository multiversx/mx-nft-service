import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { Logger } from 'winston';
import { ApiService } from '../api.service';
import { AccountIdentity } from './models/account.identity';

@Injectable()
export class ElrondIdentityService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async getProfiles(addresses: string[]): Promise<AccountIdentity[]> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/users/multiple`;
    const profiler = new PerformanceProfiler(`getProfiles ${url}`);

    const uniqueAddresses = [...new Set(addresses)];
    let request: any = { addresses: uniqueAddresses };

    try {
      let response = await this.apiService.post(url, request);
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
        `An error occurred while calling the elrond identity service on url ${url}`,
        {
          path: 'ElrondIdentityService.getProfiles',
          addresses: addresses,
          exception: error,
        },
      );
      return;
    }
  }
}
