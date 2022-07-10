import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '.';
import { NotificationStatusEnum } from 'src/modules/notifications/models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';

@Injectable()
export class NotificationsServiceDb {
  private redisClient: Redis.Redis;
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationsRepository: Repository<NotificationEntity>,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

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
        `n.auctionId =:id) and n.status='active' and n.ownerAddress=:ownerAddress`,
        {
          id: auctionId,
          ownerAddress: ownerAddress,
        },
      )
      .getOne();
  }

  async saveNotification(notification: NotificationEntity) {
    this.invalidateCache(notification.ownerAddress);
    return await this.notificationsRepository.save(notification);
  }

  async saveNotifications(notifications: NotificationEntity[]) {
    this.invalidateMultipleKeys(notifications.map((n) => n.ownerAddress));
    return await this.notificationsRepository.save(notifications);
  }

  async updateNotification(notification: NotificationEntity) {
    this.invalidateCache(notification.ownerAddress);
    notification.status = NotificationStatusEnum.Inactive;
    notification.modifiedDate = new Date(new Date().toUTCString());
    return await this.notificationsRepository.save(notification);
  }

  private getNotificationsCacheKey(address: string) {
    return generateCacheKeyFromParams('notifications', address);
  }

  public async invalidateCache(ownerAddress: string = ''): Promise<void> {
    return this.redisCacheService.del(
      this.redisClient,
      this.getNotificationsCacheKey(ownerAddress),
    );
  }

  public async invalidateMultipleKeys(ownerAddresses: string[]): Promise<void> {
    const uniqueAddresses = [...new Set(ownerAddresses)];
    this.redisCacheService.delMultiple(
      this.redisClient,
      uniqueAddresses.map((a) => this.getNotificationsCacheKey(a)),
    );
  }
}
