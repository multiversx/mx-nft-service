import { Injectable } from '@nestjs/common';
import { rabbitExchanges, rabbitQueues } from '../../rabbit-config';
import { MarkScamCollectionEvent } from './markScamCollection.event';
import { CompetingRabbitConsumer } from '../../rabbitmq.consumers';
import { CollectionScamService } from 'src/modules/scam/collection-scam.service';
import { ScamInputEnum } from 'src/modules/admins/models/scam-update.input';
@Injectable()
export class ScamUpdateEventsConsumer {
  constructor(private readonly collectionScamService: CollectionScamService) { }

  @CompetingRabbitConsumer({
    connection: 'common',
    queueName: rabbitQueues.SCAM_UPDATE,
    exchange: rabbitExchanges.SCAM_UPDATE,
  })
  async consumeScamEvents(event: MarkScamCollectionEvent) {
    if (event.type === ScamInputEnum.allow) {
      await this.collectionScamService.manuallyClearCollectionScamInfo(event.collectionIdentifier)
    } else {
      await this.collectionScamService.manuallySetCollectionScamInfo(event.collectionIdentifier)
    }
  }
}
