import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from './entity.repository';
import { CollectionTraitSummary, CollectionTraitSummaryDocument } from 'src/modules/nft-traits/models/collection-traits.model';

@Injectable()
export class TraitRepositoryService extends EntityRepository<CollectionTraitSummaryDocument> {
  constructor(
    @InjectModel(CollectionTraitSummary.name)
    private readonly collectionTraitSummaryModel: Model<CollectionTraitSummaryDocument>,
  ) {
    super(collectionTraitSummaryModel);
  }

  async getTraitSummary(collection: string): Promise<CollectionTraitSummary> {
    return CollectionTraitSummary.fromMongoDbObject(
      await this.findOne({
        identifier: collection,
      }),
    );
  }

  async saveOrUpdateTraitSummary(traitSummary: CollectionTraitSummary): Promise<void> {
    traitSummary = traitSummary.updateTimestamp();
    const res = await this.findOneAndUpdate(
      {
        identifier: traitSummary.identifier,
      },
      traitSummary.toMongoDbObject(),
    );
    if (!res) {
      await this.create(traitSummary.toMongoDbObject());
    }
  }

  async updateTraitSummaryLastUpdated(collection: string): Promise<void> {
    const res = await this.findOneAndUpdate({ identifier: collection }, { lastUpdated: new Date().getTime() });
    if (!res) {
      await this.create(
        new CollectionTraitSummary({
          identifier: collection,
          lastUpdated: new Date().getTime(),
        }),
      );
    }
  }
}
