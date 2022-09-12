import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { NotificationsService } from './notifications.service';
import { NotificationsResponse, Notification } from './models';
import { connectionFromArraySlice } from 'graphql-relay';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../auth/user';
import { NotificationsFilters } from './models/Notifications.Filter';

@Resolver(() => Notification)
export class NotificationsResolver extends BaseResolver(Notification) {
  constructor(private notificationsService: NotificationsService) {
    super();
  }

  @Query(() => NotificationsResponse)
  @UseGuards(GqlAuthGuard)
  async notifications(
    @Args({ name: 'filters', type: () => NotificationsFilters, nullable: true })
    filters: NotificationsFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
    @User() user: any,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [notifications, count] =
      await this.notificationsService.getNotifications(
        user.publicKey,
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
