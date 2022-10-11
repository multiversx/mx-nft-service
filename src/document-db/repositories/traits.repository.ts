import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from './entity.repository';
import {
  CollectionTraitSummary,
  CollectionTraitSummaryDocument,
} from 'src/modules/nft-traits/models/collection-traits.model';

@Injectable()
export class TraitRepositoryService extends EntityRepository<CollectionTraitSummaryDocument> {
  constructor(
    @InjectModel(CollectionTraitSummary.name)
    private readonly collectionTraitSummaryModel: Model<CollectionTraitSummaryDocument>,
  ) {
    super(collectionTraitSummaryModel);
  }
}
