import { register, Histogram, collectDefaultMetrics } from 'prom-client';

export class MetricsCollector {
  private static queryDurationHistogram: Histogram<string>;
  private static externalCallsHistogram: Histogram<string>;
  private static redisDurationHistogram: Histogram<string>;
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
  }

  static setQueryDuration(query: string, duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.queryDurationHistogram.labels(query).observe(duration);
  }

  static setExternalCall(system: string, duration: number, func: string = '') {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.externalCallsHistogram
      .labels(system, func)
      .observe(duration);
  }

  static setRedisDuration(action: string, duration: number) {
    MetricsCollector.ensureIsInitialized();
    MetricsCollector.redisDurationHistogram.labels(action).observe(duration);
  }

  static async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
