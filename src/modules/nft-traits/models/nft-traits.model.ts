import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { Field, InputType } from '@nestjs/graphql';
import { Nft } from 'src/common';

@InputType()
export class NftTrait {
  @Field(() => String)
  name: string;
  @Field(() => String)
  value: string;

  constructor(init?: Partial<NftTrait>) {
    Object.assign(this, init);
  }

  static fromNftMetadataAttribute(attribute: { [key: string]: string }) {
    return attribute && (attribute.trait_type !== undefined || attribute.name !== undefined) && attribute.value !== undefined
      ? new NftTrait({
          name: attribute.trait_type ?? attribute.name,
          value: attribute.value,
        })
      : null;
  }
}

export class EncodedNftValues {
  identifier: string;
  encodedValues: string[];

  constructor(init?: Partial<EncodedNftValues>) {
    Object.assign(this, init);
  }

  static encode(trait: NftTrait): string {
    return BinaryUtils.base64Encode(`${trait.name}_${trait.value}`);
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

    if (typeof nft.metadata === 'string') {
      try {
        nft.metadata = JSON.parse(nft.metadata);
      } catch {}
    }

    let newNft: NftTraits = new NftTraits({
      identifier: nft.identifier,
      traits: [],
    });

    if (nft?.metadata?.attributes) {
      for (const [key, attribute] of Object.entries(nft.metadata.attributes)) {
        if ((attribute.trait_type === undefined && attribute.name === undefined) || attribute.value === undefined) {
          continue;
        }
        const traitName = String(attribute.trait_type ?? attribute.name);
        const traitValue = String(attribute.value);
        newNft.traits.push(
          new NftTrait({
            name: traitName,
            value: traitValue,
          }),
        );
      }
    }

    return newNft;
  }

  isIdenticalTo(encodedNftValues2: EncodedNftValues): [boolean, EncodedNftValues] {
    const encodedNftValues1 = new EncodedNftValues({
      identifier: this.identifier,
      encodedValues: this.traits?.map((trait) => EncodedNftValues.encode(trait)),
    });

    if (!encodedNftValues2 && encodedNftValues1.encodedValues.length === 0) {
      return [true, encodedNftValues1];
    }

    if (encodedNftValues1.encodedValues.length !== encodedNftValues2?.encodedValues?.length) {
      return [false, encodedNftValues1];
    }

    for (const encodedValue of encodedNftValues1.encodedValues) {
      if (!encodedNftValues2.encodedValues.includes(encodedValue)) {
        return [false, encodedNftValues1];
      }
    }

    return [true, encodedNftValues1];
  }
}
