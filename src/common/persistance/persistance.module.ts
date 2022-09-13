import { DynamicModule, Global, Module, Type } from '@nestjs/common';

@Global()
@Module({})
export class PersistenceModule {
  static register(): DynamicModule {
    return {
      module: PersistenceModule,
    };
  }
}
