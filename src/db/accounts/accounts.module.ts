import { Module } from '@nestjs/common';
import { AccountsServiceDb } from './accounts.service';
import { AccountEntity } from './account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [AccountsServiceDb],
  exports: [AccountsServiceDb]
})
export class AccountsModuleDb { }
