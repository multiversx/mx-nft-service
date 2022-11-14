import { Nft } from 'src/common';
import { ElrondApiAbout } from 'src/common/services/elrond-communication/models/elrond-api-about.model';
import { NftScamInfoModel } from './nft-scam-info.model';

export class NftScamRelatedData {
  elrondApiAbout?: ElrondApiAbout;
  nftFromApi?: Nft;
  nftFromElastic?: any;
  nftFromDb?: NftScamInfoModel;
}
