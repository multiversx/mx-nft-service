import { NftMetadata } from 'src/common';

export class NftTrait {
  name: string;
  value: string;

  constructor(init?: Partial<NftTrait>) {
    Object.assign(this, init);
  }
}

export class NftTraits {
  identifier: string;
  metadata: NftMetadata;
  traits: NftTrait[];

  constructor(init?: Partial<NftTraits>) {
    Object.assign(this, init);
  }

  static fromNft(nft: any) {
    return nft
      ? {
          identifier: nft.identifier,
          metadata: nft.metadata,
          traits: [],
        }
      : null;
  }
}
