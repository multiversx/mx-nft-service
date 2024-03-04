import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { MetricsCollector } from './metrics.collector';
import { RabbitEvent } from './rabbitEvent';
import { MarketplaceEventsService } from '../rabbitmq/blockchain-events/marketplace-events.service';
import { MarketplaceTypeEnum } from '../marketplaces/models/MarketplaceType.enum';

@Controller()
export class MetricsController {
  constructor(private readonly marketplaceEvents: MarketplaceEventsService) {}
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
    const resp = await this.marketplaceEvents.handleNftEvents(payload?.events, payload?.hash, MarketplaceTypeEnum.External);
    console.log('resp', resp);
    return HttpStatus.OK;
  }
}
