import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class EntityRepository<T extends Document> {
  constructor(protected readonly entityModel: Model<T>) {}

  async create(createEntityData: any): Promise<T> {
    const entity = new this.entityModel(createEntityData);
    return entity.save({ checkKeys: false });
  }

  async findOne(entityFilterQuery: FilterQuery<T>, projection?: Record<string, unknown>): Promise<T | null> {
    return this.entityModel
      .findOne(entityFilterQuery, {
        _id: 0,
        __v: 0,
        ...projection,
      })
      .exec();
  }

  async find(entityFilterQuery: FilterQuery<T>, projection?: Record<string, unknown>): Promise<T[] | null> {
    return this.entityModel.find(entityFilterQuery, {
      _id: 0,
      __v: 0,
      ...projection,
    });
  }

  async findOneAndUpdate(
    entityFilterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<any>,
    projection?: Record<string, unknown>,
  ): Promise<T | null> {
    return this.entityModel.findOneAndUpdate(entityFilterQuery, updateEntityData, {
      new: true,
      projection: {
        _id: 0,
        __v: 0,
        ...projection,
      },
    });
  }

  async findOneAndReplace(
    entityFilterQuery: FilterQuery<T>,
    replaceEntityData: UpdateQuery<any>,
    projection?: Record<string, unknown>,
  ): Promise<T | null> {
    return this.entityModel.findOneAndReplace(entityFilterQuery, replaceEntityData, {
      new: true,
      projection: {
        _id: 0,
        __v: 0,
        ...projection,
      },
    });
  }

  async findOneAndDelete(entityFilterQuery: FilterQuery<T>): Promise<T | null> {
    const result = await this.entityModel.findOneAndDelete(entityFilterQuery);
    return result?.value ?? null;
  }

  async deleteMany(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = this.entityModel.deleteMany(entityFilterQuery);
    return (await deleteResult).deletedCount >= 1;
  }
}
