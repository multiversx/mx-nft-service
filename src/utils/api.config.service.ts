import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  private getGenericConfig<T>(path: string, alias?: string): T {
    const value = this.configService.get<T>(path);
    if (!value) {
      throw new Error(`No '${alias || path}' config present`);
    }
    return value;
  }

  getMongoDBURL(): string {
    return this.getGenericConfig<string>('MONGODB_URL');
  }

  getMongoDBDatabase(): string {
    return this.getGenericConfig<string>('MONGODB_DATABASE');
  }

  getMongoDBUsername(): string {
    return this.getGenericConfig<string>('MONGODB_USERNAME');
  }

  getMongoDBPassword(): string {
    return this.getGenericConfig<string>('MONGODB_PASSWORD');
  }
}
