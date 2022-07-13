import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as Agent from 'agentkeepalive';
import { elrondConfig } from 'src/config';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiSettings } from './models/api-settings';

@Injectable()
export class ApiService {
  private readonly defaultTimeout: number = 30000;
  private keepaliveAgent: Agent | undefined | null = null;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private getKeepAliveAgent(): Agent | undefined {
    if (this.keepaliveAgent === null) {
      if (elrondConfig.keepAlive) {
        this.keepaliveAgent = new Agent({
          keepAlive: true,
          maxSockets: Infinity,
          maxFreeSockets: 10,
          timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM), // active socket keepalive
          freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
        });
      } else {
        this.keepaliveAgent = undefined;
      }
    }

    return this.keepaliveAgent;
  }

  private getConfig(settings: ApiSettings): AxiosRequestConfig {
    const headers = {};
    if (settings.authorization) {
      headers['authorization'] = settings.authorization;
    }
    if (settings.apiKey) {
      headers['x-api-key'] = settings.apiKey;
    }
    if (settings.contentType) {
      headers['Content-Type'] = settings.contentType;
    }
    return {
      timeout: settings.timeout,
      httpAgent: this.getKeepAliveAgent(),
      transformResponse: [
        (data) => {
          try {
            return JSON.parse(data);
          } catch (error) {
            return data;
          }
        },
      ],
      headers,
    };
  }

  async get(
    url: string,
    settings: ApiSettings = new ApiSettings(),
    errorHandler?: (error: any) => Promise<boolean>,
  ): Promise<any> {
    try {
      return await axios.get(url, this.getConfig(settings));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        let customError = {
          method: 'GET',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        throw customError;
      }
    }
  }

  async post(
    url: string,
    data: any,
    settings: ApiSettings = new ApiSettings(),
    errorHandler?: (error: any) => Promise<boolean>,
  ): Promise<any> {
    let profiler = new PerformanceProfiler();

    try {
      return await axios.post(url, data, this.getConfig(settings));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        let customError = {
          method: 'POST',
          url,
          body: data,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        this.logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      MetricsCollector.setExternalCall(
        this.getHostname(url),
        profiler.duration,
      );
    }
  }

  async delete(
    url: string,
    settings: ApiSettings = new ApiSettings(),
    data: any,
    errorHandler?: (error: any) => Promise<boolean>,
  ): Promise<any> {
    let profiler = new PerformanceProfiler();

    try {
      return await axios.delete(url, { ...this.getConfig(settings), data });
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        let customError = {
          method: 'DELETE',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        this.logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      MetricsCollector.setExternalCall(
        this.getHostname(url),
        profiler.duration,
      );
    }
  }

  private getHostname(url: string): string {
    return new URL(url).hostname;
  }
}
