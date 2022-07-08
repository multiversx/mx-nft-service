import { NotificationStatusEnum } from 'src/modules/notifications/models';
import { NotificationTypeEnum } from 'src/modules/notifications/models/Notification-type.enum';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @Column({ length: 62 })
  @Index('notification_owner')
  ownerAddress: string;

  @Column({ length: 8 })
  @Index('notification_status')
  status: NotificationStatusEnum;

  @Column({ length: 8 })
  type: NotificationTypeEnum;

  @Column({ nullable: true, length: 62 })
  identifier: string;

  @Column()
  @Index('auction_id')
  auctionId: number;

  constructor(init?: Partial<NotificationEntity>) {
    super();
    Object.assign(this, init);
  }
}
