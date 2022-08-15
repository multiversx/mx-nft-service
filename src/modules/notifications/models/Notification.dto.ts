import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { NotificationStatusEnum } from './Notification-status.enum';
import { DateUtils } from 'src/utils/date-utils';
import { NotificationEntity } from 'src/db/notifications';
import { NotificationTypeEnum } from './Notification-type.enum';

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  auctionId: number;

  @Field(() => NotificationTypeEnum)
  type: NotificationTypeEnum;

  @Field(() => Int, { nullable: true })
  creationDate: number;

  @Field(() => String)
  identifier: string;

  @Field(() => String)
  marketplaceKey: string;

  constructor(init?: Partial<Notification>) {
    Object.assign(this, init);
  }

  static fromEntity(notification: NotificationEntity) {
    return notification
      ? new Notification({
          id: notification.id,
          name: notification.name,
          type: notification.type,
          creationDate: DateUtils.getTimestamp(notification.creationDate),
          identifier: notification.identifier,
          auctionId: notification.auctionId,
          marketplaceKey: notification.marketplaceKey,
        })
      : null;
  }
}
