import { Injectable } from '@nestjs/common';
import { RabbitPublisherService } from '../../rabbit.publisher';
import { ChangedEvent } from '../events/owner-changed.event';

@Injectable()
export class CacheEventsPublisherService {
  constructor(
    private readonly rabbitPublisherService: RabbitPublisherService,
  ) {}

  async publish(payload: ChangedEvent) {
    await this.rabbitPublisherService.publish(
      process.env.EXTERNAL_EXCHANGE,
      payload,
    );
  }
}
