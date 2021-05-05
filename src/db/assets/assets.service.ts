import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetsRepository: Repository<AssetEntity>,
  ) {}

  async getAssets(): Promise<AssetEntity[]> {
    return await this.assetsRepository.find();
  }

  async getAsset(_id: number): Promise<AssetEntity[]> {
    return await this.assetsRepository.find({
      select: [
        'id',
        'tokenId',
        'name',
        'royalties',
        'creationDate',
        'tokenNonce',
      ],
      where: [{ id: _id }],
    });
  }

  async updateAsset(asset: AssetEntity) {
    this.assetsRepository.save(asset);
  }

  async deleteAsset(asset: AssetEntity) {
    this.assetsRepository.delete(asset);
  }
}
