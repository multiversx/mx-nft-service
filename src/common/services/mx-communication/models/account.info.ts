import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';

export class AccountInfo {
  address: string = '';
  nonce: number = 0;
  balance: string = '';
  username: string = '';
  code: string = '';
  codeHash: string | undefined;
  rootHash: string = '';
  codeMetadata: string = '';
  developerReward: string = '';
  ownerAddress: string = '';
  scamInfo: ScamInfo | undefined = undefined;

  constructor(init?: Partial<AccountInfo>) {
    Object.assign(this, init);
  }
}
