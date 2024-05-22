import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { MetricsCollector } from './metrics.collector';
import { RabbitEvent } from './rabbitEvent';
import { MarketplaceEventsProcessingService } from '../rabbitmq/blockchain-events/marketplace-events-processing.service';

@Controller()
export class MetricsController {
  constructor(private readonly marketplaceEvents: MarketplaceEventsProcessingService) { }
  @Get('/metrics')
  async getMetrics(): Promise<string> {
    return await MetricsCollector.getMetrics();
  }

  @Get('/hello')
  async getHello(): Promise<string> {
    return 'hello';
  }

  @Post('/event')
  async notify(@Body() payload: RabbitEvent): Promise<HttpStatus> {
    await this.marketplaceEvents.handleNftAuctionEvents(payload?.events, payload?.hash);
    return HttpStatus.OK;
  }
}
