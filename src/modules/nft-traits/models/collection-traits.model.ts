import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NftTrait } from './nft-traits.model';

export type CollectionTraitSummaryDocument = CollectionTraitSummary & Document;

export interface Wtf extends CollectionTraitSummaryDocument {}

@Schema({ collection: 'nft_trait_summaries' })
export class CollectionTraitSummary {
  @Prop()
  identifier: string;
  @Prop({ type: Object })
  traitTypes: { [key: string]: { [key: string]: number } };
  @Prop()
  lastUpdated?: number;

  updateTimestamp(): this {
    this.lastUpdated = new Date().getTime();
    return this;
  }

  constructor(init?: Partial<CollectionTraitSummary>) {
    Object.assign(this, init);
  }

  addNftTraitsToCollection(traits: NftTrait[]): this {
    if (!this.traitTypes) {
      this.traitTypes = {};
    }

    for (const trait of traits) {
      if (!this.traitTypes[trait.name]) {
        this.traitTypes[trait.name] = {};
      }

      if (!this.traitTypes[trait.name][trait.value]) {
        this.traitTypes[trait.name][trait.value] = 1;
      } else {
        this.traitTypes[trait.name][trait.value]++;
      }
    }

    return this;
  }

  removeNftTraitsFromCollection(traits: NftTrait[]): this {
    if (!this.traitTypes) {
      this.traitTypes = {};
    }

    for (const trait of traits) {
      if (this.traitTypes[trait.name][trait.value] === 1) {
        delete this.traitTypes[trait.name][trait.value];

        if (Object.entries(this.traitTypes[trait.name]).length === 0) {
          delete this.traitTypes[trait.name];
        }
      } else {
        this.traitTypes[trait.name][trait.value]--;
      }
    }

    return this;
  }

  isIdentical(traitSummary: CollectionTraitSummary): boolean {
    if (
      this.identifier !== traitSummary?.identifier ||
      Object.entries(this.traitTypes).length !==
        Object.entries(traitSummary?.traitTypes).length
    ) {
      return false;
    }

    for (const [traitName, trait] of Object.entries(this.traitTypes)) {
      if (
        Object.entries(trait).length !==
        Object.entries(traitSummary.traitTypes?.[traitName]).length
      ) {
        return false;
      }

      for (const [attributeName, attributeOccurrenceCount] of Object.entries(
        this.traitTypes[traitName],
      )) {
        if (
          attributeOccurrenceCount !==
          traitSummary.traitTypes?.[traitName]?.[attributeName]
        ) {
          return false;
        }
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
