import { forwardRef } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';

export async function createTestingModule() {
  const moduleBuilder = Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'db3',
        entities: ['src/db/**/*.entity.ts'],
        synchronize: false,
      }),
      forwardRef(() => AppModule),
    ],
  });

  console.log("compiled.");
  const compiled = await moduleBuilder.compile();

  console.log("create nest app.");
  const app = compiled.createNestApplication(undefined, {
    logger: false,
  });

  console.log("app init");
  return await app.init();
}
