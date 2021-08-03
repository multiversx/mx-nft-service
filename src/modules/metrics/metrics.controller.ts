import { Controller, Get } from '@nestjs/common';
import { MetricsCollector } from './metrics.collector';

@Controller()
export class MetricsController {
  @Get('/metrics')
  async getMetrics(): Promise<string> {
    return await MetricsCollector.getMetrics();
  }

  @Get('/hello')
  async getHello(): Promise<string> {
    return 'hello';
  }
}
