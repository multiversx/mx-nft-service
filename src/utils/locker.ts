import { CpuProfiler } from '@elrondnetwork/erdnest';
import { Logger } from '@nestjs/common';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';

export class Locker {
  private static lockArray: string[] = [];

  static async lock(
    key: string,
    func: () => Promise<void>,
    log: boolean = false,
  ) {
    const logger = new Logger('Lock');
    const cpuProfiler = log ? new CpuProfiler() : undefined;

    if (Locker.lockArray.includes(key)) {
      logger.log(`${key} is already running`);
      return;
    }

    Locker.lockArray.push(key);

    const profiler = new PerformanceProfiler();

    try {
      await func();
      const cpuDuration = cpuProfiler?.stop();

      profiler.stop(`Running ${key}, CPU time ${cpuDuration?.toFixed(3)}`, log);
      MetricsCollector.setJobResult(key, 'success', profiler.duration);
    } catch (error) {
      logger.error(`Error running ${key}`);
      logger.error(error);
      const cpuDuration = cpuProfiler?.stop();

      profiler.stop(`Running ${key}, CPU time ${cpuDuration?.toFixed(3)}`, log);
      MetricsCollector.setJobResult(key, 'error', profiler.duration);
    } finally {
      Locker.lockArray.remove(key);
    }
  }
}
