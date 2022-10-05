import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';

import { NotificationsService } from '../notifications/notifications.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class OffersService {
  constructor(
    private persistenceService: PersistenceService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private notificationsService: NotificationsService,
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly rabbitPublisherService: CacheEventsPublisherService,
  ) {}
}
