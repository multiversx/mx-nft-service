import { register, Histogram, collectDefaultMetrics } from 'prom-client';

export class MetricsCollector {
  private static queryDurationHistogram: Histogram<string>;
  private static externalCallsHistogram: Histogram<string>;
  private static redisDurationHistogram: Histogram<string>;
  private static elasticDurationHistogram: Histogram<string>;
  private static auctionsEventsDurationHistogram: Histogram<string>;
  private static persistenceDurationHistogram: Histogram<string>;
  private static jobsHistogram: Histogram<string>;
  private static isDefaultMetricsRegistered = false;

  static ensureIsInitialized() {
    if (!MetricsCollector.queryDurationHistogram) {
      MetricsCollector.queryDurationHistogram = new Histogram({
        name: 'query_duration',
        help: 'The time it takes to resolve a query',
        labelNames: ['query'],
        buckets: [],
      });
    }

    if (!MetricsCollector.externalCallsHistogram) {
      MetricsCollector.externalCallsHistogram = new Histogram({
        name: 'external_apis',
        help: 'External Calls',
        labelNames: ['system', 'func'],
        buckets: [],
      });
    }

    if (!MetricsCollector.isDefaultMetricsRegistered) {
      MetricsCollector.isDefaultMetricsRegistered = true;
      collectDefaultMetrics();
    }
    if (!MetricsCollector.redisDurationHistogram) {
      MetricsCollector.redisDurationHistogram = new Histogram({
        name: 'redis_duration',
        help: 'Redis Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!MetricsCollector.elasticDurationHistogram) {
      MetricsCollector.elasticDurationHistogram = new Histogram({
        name: 'elastic_duration',
        help: 'Elastic Duration',
        labelNames: ['type'],
        buckets: [],
      });
    }

    if (!MetricsCollector.auctionsEventsDurationHistogram) {
      MetricsCollector.auctionsEventsDurationHistogram = new Histogram({
        name: 'auction_events_duration',
        help: 'Auction Events Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!MetricsCollector.persistenceDurationHistogram) {
      MetricsCollector.persistenceDurationHistogram = new Histogram({
        name: 'persistence_duration',
        help: 'Persistence Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!MetricsCollector.jobsHistogram) {
      MetricsCollector.jobsHistogram = new Histogram({
        name: 'jobs',
        help: 'Jobs',
        labelNames: ['job_identifier', 'result'],
        buckets: [],
      });
    }
  }

  static setQueryDuration(query: string, duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.queryDurationHistogram.labels(query).observe(duration);
  }

  static setExternalCall(system: string, duration: number, func: string = '') {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.externalCallsHistogram.labels(system, func).observe(duration);
  }

  static setRedisDuration(action: string, duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.redisDurationHistogram.labels(action).observe(duration);
  }

  static setElasticDuration(action: string, duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.elasticDurationHistogram.labels(action).observe(duration);
  }

  static setAuctionEventsDuration(action: string, duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.auctionsEventsDurationHistogram.labels(action).observe(duration);
  }

  static setPersistenceDuration(action: string, duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.persistenceDurationHistogram.labels(action).observe(duration);
  }

  static setJobResult(job: string, result: 'success' | 'error', duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.jobsHistogram.labels(job, result).observe(duration);
  }

  static async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
