import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Asset } from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(private elrondProxyService: ElrondProxyService) {}

  async getAssetsForUser(): Promise<Asset[] | any> {
    // this.elrondApiService.getService().
    return {};
  }

  async getNftsForUser(address: string): Promise<Asset[] | any> {
    return {};
  }
}
