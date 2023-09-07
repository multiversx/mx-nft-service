import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NftTrait } from './nft-traits.model';

export type CollectionTraitSummaryDocument = CollectionTraitSummary & Document;

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

  isIdenticalTo(traitSummary: CollectionTraitSummary): boolean {
    if (!traitSummary.traitTypes) {
      traitSummary.traitTypes = {};
    }

    if (
      this.identifier !== traitSummary?.identifier ||
      Object.entries(this.traitTypes).length !== Object.entries(traitSummary?.traitTypes)?.length
    ) {
      return false;
    }

    for (const [traitName, trait] of Object.entries(this.traitTypes)) {
      if (Object.entries(trait).length !== Object.entries(traitSummary.traitTypes?.[traitName])?.length) {
        return false;
      }

      for (const [attributeName, attributeOccurrenceCount] of Object.entries(this.traitTypes[traitName])) {
        if (attributeOccurrenceCount !== traitSummary.traitTypes?.[traitName]?.[attributeName]) {
          return false;
        }
      }
    }

    return true;
  }

  toMongoDbObject(): any {
    return {
      ...this,
      traitTypes: JSON.stringify(this.traitTypes),
    };
  }

  static fromMongoDbObject(entry: any): CollectionTraitSummary {
    if (typeof entry?.traitTypes === 'string') {
      return new CollectionTraitSummary({
        identifier: entry.identifier,
        lastUpdated: entry.lastUpdated,
        traitTypes: JSON.parse(entry.traitTypes),
      });
    }
    return entry;
  }
}

@ObjectType()
export class CollectionNftTrait {
  @Field()
  name: string = '';
  @Field(() => [CollectionNftTraitValues])
  values: CollectionNftTraitValues[] = [];

  constructor(init?: Partial<CollectionNftTrait>) {
    Object.assign(this, init);
  }

  static fromCollectionTraits(traits: { [key: string]: { [key: string]: number } }): CollectionNftTrait[] | undefined {
    if (!traits) {
      return undefined;
    }
    if (typeof traits === 'string') {
      traits = JSON.parse(traits);
    }
    let convertedTraits: CollectionNftTrait[] = [];
    for (const [traitName, trait] of Object.entries(traits)) {
      convertedTraits.push(
        new CollectionNftTrait({
          name: traitName,
          values: CollectionNftTraitValues.fromCollectionTrait(trait),
        }),
      );
    }
    return convertedTraits;
  }
}

@ObjectType()
export class CollectionNftTraitValues {
  @Field()
  value: string = '';
  @Field()
  occurrences: number = 0;

  constructor(init?: Partial<CollectionNftTraitValues>) {
    Object.assign(this, init);
  }

  static fromCollectionTrait(trait: { [key: string]: number }): CollectionNftTraitValues[] {
    let values: CollectionNftTraitValues[] = [];
    for (const [traitValue, occurrences] of Object.entries(trait)) {
      values.push(
        new CollectionNftTraitValues({
          value: traitValue,
          occurrences: occurrences,
        }),
      );
    }
    return values;
  }
}

export const CollectionTraitSummarySchema = SchemaFactory.createForClass(CollectionTraitSummary).index(
  {
    identifier: 1,
  },
  { unique: true },
);
