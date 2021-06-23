import { Module } from '@nestjs/common';
import { SocialLinksService } from './social-links.service';
import { SocialLinksResolver } from './social-links.resolver';
import { SocialLinksModuleDb } from 'src/db/socialLinks/social-link.module';

@Module({
  providers: [SocialLinksService, SocialLinksResolver],
  imports: [SocialLinksModuleDb],
  exports: [SocialLinksService],
})
export class SocialLinksModuleGraph {}
