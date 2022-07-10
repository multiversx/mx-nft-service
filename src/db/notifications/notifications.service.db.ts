import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '.';
import { NotificationStatusEnum } from 'src/modules/notifications/models';

@Injectable()
export class NotificationsServiceDb {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationsRepository: Repository<NotificationEntity>,
  ) {}

  async getNotificationsForAddress(
    address: string,
  ): Promise<[NotificationEntity[], number]> {
    const defaultSize = 100;
    return await this.notificationsRepository
      .createQueryBuilder('not')
      .where(`not.ownerAddress = :address and not.status='active'`, {
        address: address,
      })
      .limit(defaultSize)
      .getManyAndCount();
  }

  async getNotificationsByAuctionIds(
    auctionIds: number[],
  ): Promise<NotificationEntity[]> {
    return await this.notificationsRepository
      .createQueryBuilder('n')
      .where(`n.auctionId in (:...ids) and n.status='active'`, {
        ids: auctionIds,
      })
      .getMany();
  }

  async saveNotification(notification: NotificationEntity) {
    return await this.notificationsRepository.save(notification);
  }

  async saveNotifications(notifications: NotificationEntity[]) {
    return await this.notificationsRepository.save(notifications);
  }

  async updateOrder(notification: NotificationEntity) {
    notification.status = NotificationStatusEnum.Inactive;
    notification.modifiedDate = new Date(new Date().toUTCString());
    return await this.notificationsRepository.save(notification);
  }
}
