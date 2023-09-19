import { Logger } from '@nestjs/common';

export class PerformanceProfiler {
  started: number;
  description: string;
  stopped = 0;
  duration = 0;
  constructor(description = '') {
    this.started = Date.now();
    this.description = description;
  }

  start(description = '') {
    this.started = Date.now();
    this.description = description;
  }

  stop(description: string | null = null, log: boolean = false) {
    this.stopped = Date.now();
    this.duration = this.stopped - this.started;

    if (log) {
      const logger = new Logger(PerformanceProfiler.name);

      logger.log(`${description ?? this.description}: ${this.duration.toFixed(3)}ms`);
    }
  }
}
