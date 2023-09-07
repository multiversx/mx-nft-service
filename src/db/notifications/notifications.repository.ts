import { Repository } from 'typeorm';
import { NotificationEntity } from '.';
import { NotificationStatusEnum } from 'src/modules/notifications/models';
import { getMarketplaceKeyFilter } from '../collection-stats/sqlUtils';
import { NotificationTypeEnum } from 'src/modules/notifications/models/Notification-type.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationsRepository: Repository<NotificationEntity>,
  ) {}
  async getNotificationsForAddress(address: string, marketplaceKey: string): Promise<[NotificationEntity[], number]> {
    const defaultSize = 100;
    return await this.notificationsRepository
      .createQueryBuilder('not')
      .where(
        `not.ownerAddress = :address AND not.status='active' 
        ${getMarketplaceKeyFilter('not', marketplaceKey)}`,
        {
          address: address,
        },
      )
      .limit(defaultSize)
      .orderBy('id', 'DESC')
      .getManyAndCount();
  }

  async getNotificationsByAuctionIds(auctionIds: number[]): Promise<NotificationEntity[]> {
    return await this.notificationsRepository
      .createQueryBuilder('n')
      .where(`n.auctionId in (:...ids) and n.status='active'`, {
        ids: auctionIds,
      })
      .getMany();
  }

  async getNotificationsByIdentifiersAndType(auctionIds: string[], type: NotificationTypeEnum[]): Promise<NotificationEntity[]> {
    return await this.notificationsRepository
      .createQueryBuilder('n')
      .where(`n.identifier in (:...ids) AND n.type in (:...types) and n.status='active'`, {
        ids: auctionIds,
        types: type,
      })
      .getMany();
  }

  async getNotificationByIdAndOwner(auctionId: number, ownerAddress: string): Promise<NotificationEntity> {
    return await this.notificationsRepository
      .createQueryBuilder('n')
      .where(`n.auctionId =:id and n.status='active' and n.ownerAddress=:ownerAddress`, {
        id: auctionId,
        ownerAddress: ownerAddress,
      })
      .getOne();
  }

  async saveNotification(notification: NotificationEntity) {
    return await this.notificationsRepository.save(notification);
  }

  async saveNotifications(notifications: NotificationEntity[]) {
    return await this.notificationsRepository.save(notifications);
  }

  async updateNotification(notification: NotificationEntity) {
    notification.status = NotificationStatusEnum.Inactive;
    notification.modifiedDate = new Date(new Date().toUTCString());
    return await this.notificationsRepository.save(notification);
  }
}
