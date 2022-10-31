import { Nft } from 'src/common';
import { ElrondApiAbout } from 'src/common/services/elrond-communication/models/elrond-api-about.model';
import { NftScamEntity } from 'src/db/reports-nft-scam';

export class NftScamRelatedData {
  elrondApiAbout?: ElrondApiAbout;
  nftFromApi?: Nft;
  nftFromElastic?: any;
  nftFromDb?: NftScamEntity;
}
