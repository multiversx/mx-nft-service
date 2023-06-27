import { MxApiAbout } from 'src/common/services/mx-communication/models/mx-api-about.model';
import { Asset } from 'src/modules/assets/models';
import { NftScamInfoModel } from './nft-scam-info.model';

export class NftScamRelatedData {
  mxApiAbout?: MxApiAbout;
  nftFromApi?: Asset;
  nftFromElastic?: any;
  nftFromDb?: NftScamInfoModel;

  constructor(init?: Partial<NftScamRelatedData>) {
    Object.assign(this, init);
  }
}
