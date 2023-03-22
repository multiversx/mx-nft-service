import { Injectable } from '@nestjs/common';
import { Asset } from 'src/modules/assets/models/Asset.dto';

@Injectable()
export class PluginService {
  async computeScamInfo(_nft: Asset[]): Promise<void> {}
}
