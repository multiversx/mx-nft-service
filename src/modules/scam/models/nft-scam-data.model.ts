import { Nft } from 'src/common';
import { MxApiAbout } from 'src/common/services/mx-communication/models/mx-api-about.model';
import { ScamInfoModel } from './scam-info.model';

export class NftScamRelatedData {
  mxApiAbout?: MxApiAbout;
  nftFromApi?: Nft;
  nftFromElastic?: any;
  nftFromDb?: ScamInfoModel;
}
