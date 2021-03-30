import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Use Axios Retry for failing http request calls
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axiosRetry = require('axios-retry');
import { Injectable } from '@nestjs/common';
import { InternalServerError } from '../../errors';
import { Generic } from '../../../utils';
/**
 * Wrapper for axios
 */
@Injectable()
export class HttpService {
  /**
   * Base URL for http service
   */
  protected url: string;
  /**
   * Axios instance
   */
  protected httpService: AxiosInstance;

  /**
   * Config to be used with this service.
   */
  protected config;

  /**
   * Create a new instance for the received url
   * @param contextService
   */
  constructor() {
    this.setup();
  }

  /**
   * Method used to create axios instance
   */
  protected setup() {
    this.httpService = axios.create();
    axiosRetry(this.httpService, {
      retries: 3,
      retryDelay: (retryCount) => {
        return retryCount * 500;
      },
    });
  }

  /**
   * Get request
   * @param url
   * @param config
   */
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.httpService.get<T, R>(url, this.configWithURL(config));
  }

  /**
   * Head request
   * @param url
   * @param config
   */
  head<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig,
  ) {
    return this.httpService.head<T, R>(url, this.configWithURL(config));
  }

  /**
   * Post Request
   * @param url
   * @param data
   * @param config
   */
  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.httpService.post<T, R>(url, data, this.configWithURL(config));
  }

  /**
   * Update config to include the correct baseURL
   * @param config
   */
  private configWithURL(config?: AxiosRequestConfig): AxiosRequestConfig {
    const networkUrl = this.config;
    const baseURL = config?.baseURL ?? networkUrl ?? this.url;
    if (!baseURL) {
      throw InternalServerError.fromError({
        message: 'Base URL is not set for request',
        error: Generic.notConfigured,
      });
    }
    return {
      ...config,
      baseURL,
    };
  }
}
