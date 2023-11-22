import { Injectable } from '@nestjs/common';
import { rabbitExchanges } from '../../rabbit-config';
import { RabbitPublisherService } from '../../rabbit.publisher';
import { ChangedEvent } from '../events/changed.event';
import { UserNftLikeEvent } from '../events/userNftLike.event';

@Injectable()
export class CacheEventsPublisherService {
  constructor(private readonly rabbitPublisherService: RabbitPublisherService) {}

  async publish(payload: ChangedEvent) {
    await this.rabbitPublisherService.publish(rabbitExchanges.CACHE_INVALIDATION, payload);
  }
}

@Injectable()
export class NftLikePublisherService {
  constructor(private readonly rabbitPublisherService: RabbitPublisherService) {}

  async publish(payload: UserNftLikeEvent) {
    await this.rabbitPublisherService.publish(rabbitExchanges.NFT_LIKE, payload);
  }
}

@Injectable()
export class MarketplaceDisablePublisherService {
  constructor(private readonly rabbitPublisherService: RabbitPublisherService) {}

  async publish(payload: any) {
    await this.rabbitPublisherService.publish(rabbitExchanges.DISABLE_MARKETPLACE_EVENTS, payload);
  }
}
