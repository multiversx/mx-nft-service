import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialLinkToAccountEntity } from './social-link-to-account.entity';
import { SocialLinksToAccountServiceDb } from './social-link.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocialLinkToAccountEntity])],
  providers: [SocialLinksToAccountServiceDb],
  exports: [SocialLinksToAccountServiceDb],
})
export class SocialLinksToAccountModuleDb {}
