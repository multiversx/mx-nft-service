import { Injectable, Logger } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { ApiConfigService } from 'src/utils/api.config.service';
import { NativeAuthSigner } from '@elrondnetwork/erdnest/lib/src/utils/native.auth.signer';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';
import { getFilePathFromDist } from 'src/utils/helpers';

@Injectable()
export class MxExtrasApiService {
  private url: string;
  private nativeAuthSigner: NativeAuthSigner;

  constructor(
    private readonly logger: Logger,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.url = this.apiConfigService.getExtrasApiUrl();
    this.nativeAuthSigner = new NativeAuthSigner({
      host: 'NftService',
      apiUrl: this.apiConfigService.getApiUrl(),
      signerPrivateKeyPath: getFilePathFromDist(mxConfig.pemFileName),
    });
  }

  async setCollectionScam(collection: string): Promise<void> {
    const body = {
      [`${collection}`]: 'Scam report',
    };
    const res = await this.doPost(
      this.setCollectionScam.name,
      'permissions/deny/collections',
      body,
    );
    console.log(body, res);
  }

  async clearCollectionScam(collection: string): Promise<void> {}

  private async getConfig(): Promise<ApiSettings> {
    const accessTokenInfo = await this.nativeAuthSigner.getToken();
    console.log(accessTokenInfo);
    return {
      authorization: `Bearer ${accessTokenInfo.token}`,
      timeout: 500,
    };
  }

  private async doPost(
    name: string,
    resourceUrl: string,
    body: any,
  ): Promise<any> {
    try {
      const config = await this.getConfig();
      const response = await this.apiService.post(
        `${this.url}/${resourceUrl}`,
        body,
        config,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error when trying to get run ${name}`, {
        error: error.message,
        path: `${MxExtrasApiService.name}.${this.doPost.name}`,
      });
    }
  }
}
