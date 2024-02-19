import { INestApplication } from '@nestjs/common';
//import { createTestingModule } from './typeorm-for-tests';
import { createTestingModule } from './create-testing-module';
let app: INestApplication;

export async function getApplication() {
  if (!app) {
    console.log("Get application.")
    app = await createTestingModule();
  }

  return app;
}
