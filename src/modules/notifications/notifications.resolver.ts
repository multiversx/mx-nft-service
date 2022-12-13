import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { NotificationsService } from './notifications.service';
import { NotificationsResponse, Notification } from './models';
import { connectionFromArraySlice } from 'graphql-relay';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import { UseGuards } from '@nestjs/common';
import { NotificationsFilters } from './models/Notifications.Filter';
import { Jwt, JwtAuthenticateGuard } from '@elrondnetwork/erdnest';

@Resolver(() => Notification)
export class NotificationsResolver extends BaseResolver(Notification) {
  constructor(private notificationsService: NotificationsService) {
    super();
  }

  @Query(() => NotificationsResponse)
  @UseGuards(JwtAuthenticateGuard)
  async notifications(
    @Args({ name: 'filters', type: () => NotificationsFilters, nullable: true })
    filters: NotificationsFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
    @Jwt('address') address: string,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [notifications, count] =
      await this.notificationsService.getNotifications(
        address,
        filters?.marketplaceKey,
      );
    const page = connectionFromArraySlice(notifications, pagination, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }
}
