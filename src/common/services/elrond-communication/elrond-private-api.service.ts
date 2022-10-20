import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { Logger } from 'winston';
import * as Agent from 'agentkeepalive';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { elrondConfig } from 'src/config';
import { ApiNetworkProvider } from '@elrondnetwork/erdjs-network-providers/out';

@Injectable()
export class ElrondPrivateApiService {
  private privateApiProvider: ApiNetworkProvider;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const keepAliveOptions = {
      maxSockets: elrondConfig.keepAliveMaxSockets,
      maxFreeSockets: elrondConfig.keepAliveMaxFreeSockets,
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      freeSocketTimeout: elrondConfig.keepAliveFreeSocketTimeout,
    };
    const httpAgent = new Agent(keepAliveOptions);
    const httpsAgent = new Agent.HttpsAgent(keepAliveOptions);

    this.privateApiProvider = new ApiNetworkProvider(
      process.env.ELROND_PRIVATE_API,
      {
        timeout: elrondConfig.proxyTimeout,
        httpAgent: elrondConfig.keepAlive ? httpAgent : null,
        httpsAgent: elrondConfig.keepAlive ? httpsAgent : null,
        headers: {
          origin: 'NftService',
        },
      },
    );
  }

  getPrivateService(): ApiNetworkProvider {
    return this.privateApiProvider;
  }

  async doPostGeneric(
    name: string,
    resourceUrl: string,
    payload: any,
  ): Promise<any> {
    try {
      const profiler = new PerformanceProfiler(`${name} ${resourceUrl}`);
      const service = this.getPrivateService();
      const response = await service.doPostGeneric(resourceUrl, payload);
      profiler.stop();

      MetricsCollector.setExternalCall(
        ElrondPrivateApiService.name,
        profiler.duration,
        name,
      );

      return response;
    } catch (error) {
      if (error.inner?.response?.status === HttpStatus.NOT_FOUND) {
        return;
      }
      let customError = {
        method: 'POST',
        resourceUrl,
        response: error.inner?.response?.data,
        status: error.inner?.response?.status,
        message: error.message,
        name: error.name,
      };
      this.logger.error(
        `An error occurred while calling the elrond private-api service on url ${resourceUrl}`,
        {
          path: 'ElrondPrivateApiService.doPostGeneric',
          error: customError,
        },
      );
    }
  }
}
