import { IssueCollectionArgs } from '..';

export class IssueCollectionRequest {
  tokenName: string;
  tokenTicker: string;
  canFreeze: boolean = false;
  canWipe: boolean = false;
  canPause: boolean = false;
  canTransferNFTCreateRole: boolean = false;
  collectionType: 'issueSemiFungible' | 'issueNonFungible';

  constructor(init?: Partial<IssueCollectionRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(issueCollectionArgs: IssueCollectionArgs, collectionType: 'issueSemiFungible' | 'issueNonFungible') {
    return new IssueCollectionRequest({
      tokenName: issueCollectionArgs.tokenName,
      tokenTicker: issueCollectionArgs.tokenTicker,
      canFreeze: issueCollectionArgs.canFreeze,
      canWipe: issueCollectionArgs.canWipe,
      canPause: issueCollectionArgs.canPause,
      canTransferNFTCreateRole: issueCollectionArgs.canTransferNFTCreateRole,
      collectionType: collectionType,
    });
  }
}
