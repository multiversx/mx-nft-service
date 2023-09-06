import { Locker } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OfferStatusEnum } from 'src/modules/offers/models';

@Injectable()
export class ExpiredOffersService {
  constructor(private persistanceService: PersistenceService, private notificationsService: NotificationsService) {}

  @Cron('*/8 * * * * *')
  async updateExpiredOffers() {
    await Locker.lock(
      'Update expired offers to claimable',
      async () => {
        const expiredOffers = await this.persistanceService.getOffersThatReachedDeadline();
        if (!expiredOffers || expiredOffers?.length === 0) return;
        await this.notificationsService.generateOffersNotifications(expiredOffers);
        await this.persistanceService.updateOffers(
          expiredOffers?.map((a) => {
            return {
              ...a,
              status: OfferStatusEnum.Expired,
              modifiedDate: new Date(new Date().toUTCString()),
            };
          }),
        );
      },
      true,
    );
  }
}
