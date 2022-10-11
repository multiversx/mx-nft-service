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

  getNftTraitSummariesDbUrl(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_URL');
  }

  getNftTraitSummariesDatabase(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_DATABASE');
  }

  getNftTraitSummariesUsername(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_USERNAME');
  }

  getNftTraitSummariesPassword(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_PASSWORD');
  }
}
