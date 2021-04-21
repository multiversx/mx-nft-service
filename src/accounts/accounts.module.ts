import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountEntity } from './account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [AccountsService],
})
export class AccountsModule {}
