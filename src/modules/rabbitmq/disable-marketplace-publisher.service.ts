import { Injectable } from '@nestjs/common';
import { rabbitExchanges } from './rabbit-config';
import { RabbitPublisherService } from './rabbit.publisher';

@Injectable()
export class MarketplaceDisablePublisherService {
  constructor(private readonly rabbitPublisherService: RabbitPublisherService) {}

  async publish(payload: any) {
    await this.rabbitPublisherService.publish(rabbitExchanges.DISABLE_MARKETPLACE_EVENTS, payload);
  }
}
