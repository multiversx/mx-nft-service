import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { Locker } from 'src/utils/locker';

@Injectable()
export class ExpiredOffersService {
  constructor(
    private persistanceService: PersistenceService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('*/8 * * * * *')
  async updateExpiredOffers() {
    await Locker.lock(
      'Update expired offers to claimable',
      async () => {
        const expiredOffers =
          await this.persistanceService.getOffersThatReachedDeadline();
        // notifications will be done in further pr
        // await this.notificationsService.generateNotifications(endedAuctions);
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
