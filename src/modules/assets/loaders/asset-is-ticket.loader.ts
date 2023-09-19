import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { IsTicketRedisHandler } from './asset-is-ticket.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class IsTicketProvider extends BaseProvider<string> {
  constructor(isTicketRedisHandler: IsTicketRedisHandler, private persistenceService: PersistenceService) {
    super(isTicketRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const assetTickets = await this.persistenceService.getTicketCollectionsByIdentifiers(identifiers);
    return assetTickets?.groupBy((collection) => collection.identifier);
  }
}
