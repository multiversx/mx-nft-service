import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { NotificationsService } from './notifications.service';
import { NotificationsResponse, Notification } from './models';
import { connectionFromArraySlice } from 'graphql-relay';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import { UseGuards } from '@nestjs/common';
import { NotificationsFilters } from './models/Notifications.Filter';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';

@Resolver(() => Notification)
export class NotificationsResolver extends BaseResolver(Notification) {
  constructor(private notificationsService: NotificationsService) {
    super();
  }

  @Query(() => NotificationsResponse)
  @UseGuards(JwtOrNativeAuthGuard)
  async notifications(
    @Args({ name: 'filters', type: () => NotificationsFilters, nullable: true })
    filters: NotificationsFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
    @AuthUser() user: UserAuthResult,
  ) {
    const { limit, offset } = getPagingParameters(pagination);
    const [notifications, count] = await this.notificationsService.getNotifications(user.address, filters?.marketplaceKey);
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
