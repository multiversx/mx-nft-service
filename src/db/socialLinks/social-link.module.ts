import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialLinkEntity } from './social-link.entity';
import { SocialLinksServiceDb } from './social-link.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocialLinkEntity])],
  providers: [SocialLinksServiceDb],
  exports: [SocialLinksServiceDb],
})
export class SocialLinksModuleDb {}
