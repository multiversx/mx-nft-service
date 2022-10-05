import { Nft } from 'src/common';

export class NftTrait {
  name: string;
  value: string;

  constructor(init?: Partial<NftTrait>) {
    Object.assign(this, init);
  }

  static fromNftMetadataAttribute(attribute: { [key: string]: string }) {
    return attribute
      ? new NftTrait({
          name: attribute.trait_type,
          value: attribute.value,
        })
      : null;
  }
}

export class NftTraits {
  identifier: string;
  traits: NftTrait[];

  constructor(init?: Partial<NftTraits>) {
    Object.assign(this, init);
  }

  static fromNft(nft: Nft) {
    if (!nft) {
      return null;
    }

    let newNft: NftTraits = new NftTraits({
      identifier: nft.identifier,
      traits: [],
    });

    for (const [key, value] of Object.entries(nft.metadata.attributes)) {
      if (value.trait_type === undefined || value.value === undefined) {
        continue;
      }
      const traitName = String(value.trait_type);
      const traitValue = String(value.value);
      newNft.traits.push(
        new NftTrait({
          name: traitName,
          value: traitValue,
        }),
      );
    }

    return newNft;
  }
}
