import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CacheInvalidationAdminService } from './cache-admin-invalidation.service';
import { CacheSetterAdminService } from './cache-admin-setter.service';

@Module({
  imports: [CommonModule],
  providers: [CacheInvalidationAdminService, CacheSetterAdminService],
  exports: [CacheInvalidationAdminService, CacheSetterAdminService],
})
export class CacheAdminEventsModule {}
