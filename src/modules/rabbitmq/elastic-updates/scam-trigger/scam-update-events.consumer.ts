import { Injectable } from '@nestjs/common';
import { rabbitExchanges, rabbitQueues } from '../../rabbit-config';
import { MarkScamCollectionEvent } from './markScamCollection.event';
import { CompetingRabbitConsumer } from '../../rabbitmq.consumers';
import { CollectionScamService } from 'src/modules/scam/collection-scam.service';
@Injectable()
export class ScamUpdateEventsConsumer {
  constructor(private readonly collectionScamService: CollectionScamService) { }

  @CompetingRabbitConsumer({
    connection: 'common',
    queueName: rabbitQueues.SCAM_UPDATE,
    exchange: rabbitExchanges.SCAM_UPDATE,
  })
  async consumeScamEvents(event: MarkScamCollectionEvent) {
    console.log({ event })
    // if (event.type === ScamInfoTypeEnum.none) {
    //   await this.collectionScamService.manuallyClearCollectionScamInfo(event.collectionIdentifier)
    // } else {
    //   await this.collectionScamService.manuallySetCollectionScamInfo(event.collectionIdentifier)
    // }
  }
}
