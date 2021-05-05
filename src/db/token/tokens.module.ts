import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from './token.entity';
import { TokensServiceDb } from './tokens.servicedb';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity])],
  providers: [TokensServiceDb],
  exports: [TokensServiceDb],
})
export class TokensDbModule {}
