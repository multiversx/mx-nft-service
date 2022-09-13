import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Inject, Injectable } from '@nestjs/common';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PersistenceInterface } from './persistance.interface';

@Injectable()
export class PersistenceService implements PersistenceInterface {
  constructor(
    @Inject('PersistenceInterface')
    private readonly persistenceInterface: PersistenceInterface,
  ) {}

  private async execute<T>(key: string, action: Promise<T>): Promise<T> {
    const profiler = new PerformanceProfiler();

    try {
      return await action;
    } finally {
      profiler.stop();

      MetricsCollector.setPersistenceDuration(key, profiler.duration);
    }
  }
}
