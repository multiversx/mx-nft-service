import { CleanupInterceptor, FieldsInterceptor } from '@multiversx/sdk-nestjs-http';
import { forwardRef } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { DataSource } from 'typeorm';

export let ApplicationDataStore: DataSource = null;

export async function createTestingModule() {
  console.log("Create testing module.");
  const moduleBuilder = Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: "sqlite",
        database: ":memory:",
        dropSchema: true,
        entities: ['src/db/**/*.entity.ts'],
        synchronize: false,
        logging: true,
      }),
      forwardRef(() => AppModule),
    ],
  });

  console.log("module builder");
  const compiled = await moduleBuilder.compile();

  console.log("app db ");
  const ApplicationDataStore = compiled.createNestApplication();

  ApplicationDataStore.useGlobalInterceptors(
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );

  console.log(" app init ");
  return await ApplicationDataStore.init();

}
