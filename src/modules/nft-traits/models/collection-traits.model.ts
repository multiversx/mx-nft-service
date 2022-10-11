import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NftTrait } from './nft-traits.model';

@ObjectType()
export class AttributeSummary {
  @Field(() => String)
  value: string;
  @Field(() => Number)
  occurenceCount: number;
  @Field(() => Number)
  occurencePercentage: number;

  constructor(init?: Partial<AttributeSummary>) {
    Object.assign(this, init);
  }

  isIdentical(attribute: AttributeSummary): boolean {
    if (
      this.value !== attribute.value ||
      this.occurenceCount !== attribute.occurenceCount ||
      this.occurencePercentage !== attribute.occurencePercentage
    ) {
      return false;
    }

    return true;
  }
}

@ObjectType()
export class TraitSummary {
  @Field(() => String)
  name: string;
  @Field(() => [AttributeSummary])
  attributes: AttributeSummary[];
  @Field(() => Number)
  occurenceCount: number;
  @Field(() => Number)
  occurencePercentage: number;

  constructor(init?: Partial<TraitSummary>) {
    Object.assign(this, init);
  }

  addTraitToAttributes(newTrait: NftTrait, collectionTotalSize: number): this {
    let attribute = this.attributes?.find((a) => a.value === newTrait.value);

    if (!attribute) {
      if (!this.attributes) {
        this.attributes = [];
      }
      this.attributes.push(
        new AttributeSummary({
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

  isIdentical(trait: TraitSummary) {
    if (
      this.name !== trait.name ||
      this.occurenceCount !== trait.occurenceCount ||
      this.occurencePercentage !== trait.occurencePercentage
    ) {
      return false;
    }

    if (this.attributes.length !== trait.attributes.length) {
      return false;
    }

    for (const attribute of this.attributes) {
      const correspondingAttribute = trait.attributes.find(
        (a) => a.value === attribute.value,
      );

      if (
        !correspondingAttribute ||
        !attribute.isIdentical(correspondingAttribute)
      ) {
        return false;
      }
    }

    return true;
  }
}

export type CollectionTraitSummaryDocument = CollectionTraitSummary & Document;

@Schema()
export class CollectionTraitSummary {
  @Prop()
  identifier: string;
  @Prop([TraitSummary])
  traitTypes: TraitSummary[];

  constructor(init?: Partial<CollectionTraitSummary>) {
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
      let traitType = this.traitTypes?.find((t) => t.name === trait.name);

      if (traitType) {
        traitType.addTraitToAttributes(trait, collectionTotalSize);
      } else {
        if (!this.traitTypes) {
          this.traitTypes = [];
        }
        this.traitTypes.push(
          new TraitSummary({
            name: trait.name,
            attributes: [
              new AttributeSummary({
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

  isIdentical(traitSummary: CollectionTraitSummary): boolean {
    if (
      this.identifier !== traitSummary.identifier ||
      this.traitTypes.length !== traitSummary.traitTypes.length
    ) {
      return false;
    }

    for (const traitType of this.traitTypes) {
      const correspondingTrait = traitSummary.traitTypes.find(
        (t) => t.name === traitType.name,
      );

      if (!correspondingTrait || !traitType.isIdentical(correspondingTrait)) {
        return false;
      }
    }

    return true;
  }
}

export const CollectionTraitSummarySchema = SchemaFactory.createForClass(
  CollectionTraitSummary,
).index(
  {
    identifier: 1,
  },
  { unique: true },
);
