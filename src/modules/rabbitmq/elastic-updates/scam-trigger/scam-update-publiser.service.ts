import { Injectable } from '@nestjs/common';
import { rabbitExchanges } from '../../rabbit-config';
import { RabbitPublisherService } from '../../rabbit.publisher';
import { MarkScamCollectionEvent } from './markScamCollection.event';


@Injectable()
export class ScamUpdatePublisherService {
  constructor(private readonly rabbitPublisherService: RabbitPublisherService) { }

  async publish(payload: MarkScamCollectionEvent) {
    await this.rabbitPublisherService.publish(rabbitExchanges.SCAM_UPDATE, payload);
  }
}
