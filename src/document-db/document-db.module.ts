import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common.module';
import { ApiConfigService } from 'src/utils/api.config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [CommonModule],
      useFactory: async (configService: ApiConfigService) => ({
        uri: `${configService.getMongoDBURL()}`,
        dbName: configService.getMongoDBDatabase(),
        user: configService.getMongoDBUsername(),
        pass: configService.getMongoDBPassword(),
        tlsAllowInvalidCertificates: true,
      }),
      inject: [ApiConfigService],
    }),
  ],
  providers: [],
  exports: [],
})
export class DocumentDatabaseModule {}
