import { Injectable } from '@nestjs/common';
import { rabbitExchanges } from '../../rabbit-config';
import { RabbitPublisherService } from '../../rabbit.publisher';
import { ChangedEvent } from '../events/owner-changed.event';

@Injectable()
export class CacheEventsPublisherService {
  constructor(
    private readonly rabbitPublisherService: RabbitPublisherService,
  ) {}

  async publish(payload: ChangedEvent) {
    await this.rabbitPublisherService.publish(
      rabbitExchanges.CACHE_INVALIDATION,
      payload,
    );
  }
}
