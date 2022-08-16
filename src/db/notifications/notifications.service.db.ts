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
      .orderBy('id', 'DESC')
      .getManyAndCount();
  }

  async getNotificationsForMarketplace(
    address: string,
    merketplaceKey: string,
  ): Promise<[NotificationEntity[], number]> {
    const defaultSize = 100;
    return await this.notificationsRepository
      .createQueryBuilder('not')
      .where(
        `not.ownerAddress = :address AND not.status='active' AND not.marketplaceKey = :marketplaceKey`,
        {
          address: address,
          marketplaceKey: merketplaceKey,
        },
      )
      .limit(defaultSize)
      .orderBy('id', 'DESC')
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

  async getNotificationByIdAndOwner(
    auctionId: number,
    ownerAddress: string,
  ): Promise<NotificationEntity> {
    return await this.notificationsRepository
      .createQueryBuilder('n')
      .where(
        `n.auctionId =:id and n.status='active' and n.ownerAddress=:ownerAddress`,
        {
          id: auctionId,
          ownerAddress: ownerAddress,
        },
      )
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
