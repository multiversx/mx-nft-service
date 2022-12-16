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

  getMongoDbUrl(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_URL');
  }

  getMongoDbName(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_DATABASE');
  }

  getMongoDbUsername(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_USERNAME');
  }

  getMongoDbPassword(): string {
    return this.getGenericConfig<string>('NFT_TRAIT_SUMMARIES_DB_PASSWORD');
  }

  getApiUrl(): string {
    return this.getGenericConfig<string>('ELROND_API');
  }

  getToolsUrl(): string {
    return this.getGenericConfig<string>('ELROND_TOOLS');
  }

  getKeepAliveTimeoutDownstream(): number {
    return parseInt(
      this.getGenericConfig<string>('KEEPALIVE_TIMEOUT_DOWNSTREAM'),
    );
  }

  getCommonRabbitMqUrl(): string {
    return this.getGenericConfig<string>('COMMON_RABBITMQ_URL');
  }

  getSecurityAdmins(): string[] {
    return this.getGenericConfig<string[]>('ADMINS');
  }

  getJwtSecret(): string {
    return this.getGenericConfig<string>('JWT_SECRET_KEY');
  }

  isNsfwIndexerActive(): boolean {
    return this.getGenericConfig<string>('ENABLE_NSFW_CRONJOBS') === 'true';
  }

  isRarityIndexerActive(): boolean {
    return this.getGenericConfig<string>('ENABLE_RARITY_CRONJOBS') === 'true';
  }

  isTraitsIndexerActive(): boolean {
    return this.getGenericConfig<string>('ENABLE_TRAITS_CRONJOBS') === 'true';
  }

  isScamInfoIndexerActive(): boolean {
    return this.getGenericConfig<string>('ENABLE_SCAM_CRONJOBS') === 'true';
  }

  isMarketplaceEventsIndexerActive(): boolean {
    return (
      this.getGenericConfig<string>('ENABLE_MARKETPLACE_EVENTS') === 'true'
    );
  }

  isIndexerInstance(): boolean {
    if (
      this.isNsfwIndexerActive() ||
      this.isScamInfoIndexerActive() ||
      this.isRarityIndexerActive() ||
      this.isTraitsIndexerActive() ||
      this.isMarketplaceEventsIndexerActive()
    ) {
      return true;
    }
  }
}
