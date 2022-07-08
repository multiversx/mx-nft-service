import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { NotificationEntity, NotificationsServiceDb } from '.';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  providers: [RedisCacheService, NotificationsServiceDb],
  exports: [NotificationsServiceDb],
})
export class NotificationsModuleDb {}
