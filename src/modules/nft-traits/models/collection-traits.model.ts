import { NftTrait } from './nft-traits.model';

export class AttributeType {
  value: string;
  occurenceCount: number;
  occurencePercentage: number;

  constructor(init?: Partial<AttributeType>) {
    Object.assign(this, init);
  }
}

export class TraitType {
  name: string;
  attributes: AttributeType[];
  occurenceCount: number;
  occurencePercentage: number;

  constructor(init?: Partial<TraitType>) {
    Object.assign(this, init);
  }

  addTraitToAttributes(newTrait: NftTrait, collectionTotalSize: number): this {
    let attribute = this.attributes.find((a) => a.value === newTrait.value);

    if (!attribute) {
      this.attributes.push(
        new AttributeType({
          value: newTrait.value,
          occurenceCount: 1,
          occurencePercentage: (1 / collectionTotalSize) * 100,
        }),
      );
    } else {
      attribute.occurenceCount++;
      attribute.occurencePercentage =
        (attribute.occurenceCount / collectionTotalSize) * 100;
    }

    this.occurenceCount++;
    this.occurencePercentage =
      (this.occurenceCount / collectionTotalSize) * 100;

    return this;
  }

  removeTraitFromAttributes(
    oldTrait: NftTrait,
    collectionTotalSize: number,
  ): this {
    this.occurenceCount--;
    this.occurencePercentage =
      (this.occurenceCount / collectionTotalSize) * 100;

    let attribute = this.attributes.find((a) => a.value === oldTrait.value);
    if (attribute.occurenceCount === 1) {
      this.attributes = this.attributes.filter(
        (a) => a.value !== oldTrait.value,
      );
      return this;
    }

    attribute.occurenceCount--;
    attribute.occurencePercentage =
      (attribute.occurenceCount / collectionTotalSize) * 100;

    return this;
  }
}

export class CollectionTraits {
  identifier: string;
  traitTypes: TraitType[];

  constructor(init?: Partial<CollectionTraits>) {
    Object.assign(this, init);
  }

  addNftTraitsToCollection(
    nftTraits: NftTrait[],
    collectionTotalSize: number = undefined,
    sizeChanged: boolean = false,
  ): this {
    if (!collectionTotalSize) {
      collectionTotalSize = this.getSize() + 1;
      sizeChanged = true;
    }

    for (const trait of nftTraits) {
      let traitType = this.traitTypes.find((t) => t.name === trait.name);

      if (traitType) {
        traitType.addTraitToAttributes(trait, collectionTotalSize);
      } else {
        this.traitTypes.push(
          new TraitType({
            name: trait.name,
            attributes: [
              new AttributeType({
                value: trait.value,
                occurenceCount: 1,
                occurencePercentage: (1 / collectionTotalSize) * 100,
              }),
            ],
            occurenceCount: 1,
            occurencePercentage: (1 / collectionTotalSize) * 100,
          }),
        );
      }
    }

    if (sizeChanged) {
      return this.updateOcurrencePercentages(collectionTotalSize);
    }

    return this;
  }

  removeNftTraitsFromCollection(
    traits: NftTrait[],
    collectionTotalSize: number = undefined,
    sizeChanged: boolean = false,
  ): this {
    if (!collectionTotalSize) {
      collectionTotalSize = this.getSize() - 1;
      sizeChanged = true;
    }

    for (const trait of traits) {
      let traitType = this.traitTypes.find((t) => t.name === trait.name);

      if (traitType.occurenceCount === 1) {
        this.traitTypes = this.traitTypes.filter((t) => t.name !== trait.name);
        continue;
      }

      traitType = traitType.removeTraitFromAttributes(
        trait,
        collectionTotalSize,
      );
    }

    if (sizeChanged) {
      return this.updateOcurrencePercentages(collectionTotalSize);
    }

    return this;
  }

  getSize(): number {
    return (
      (this.traitTypes[0].occurenceCount * 100) /
      this.traitTypes[0].occurencePercentage
    );
  }

  private updateOcurrencePercentages(collectionTotalSize: number): this {
    for (let trait of this.traitTypes) {
      trait.occurencePercentage =
        (trait.occurenceCount / collectionTotalSize) * 100;
      for (let attribute of trait.attributes) {
        attribute.occurencePercentage =
          (attribute.occurenceCount / collectionTotalSize) * 100;
      }
    }
    return this;
  }
}
