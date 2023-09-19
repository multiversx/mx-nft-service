import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { CollectionAssetModel } from './models';
import { AssetScamInfoProvider } from '../assets/loaders/assets-scam-info.loader';
import { ScamInfo } from '../assets/models/ScamInfo.dto';

@Resolver(() => CollectionAssetModel)
export class CollectionAssetsModelResolver extends BaseResolver(CollectionAssetModel) {
  constructor(private assetScamProvider: AssetScamInfoProvider) {
    super();
  }

  @ResolveField('scamInfo', () => ScamInfo)
  async scamInfo(@Parent() collectionAssetModel: CollectionAssetModel) {
    if (collectionAssetModel.scamInfo) {
      return collectionAssetModel.scamInfo;
    }
    const { identifier } = collectionAssetModel;
    const scamInfo = await this.assetScamProvider.load(identifier);
    const scamInfoValue = scamInfo.value;

    return scamInfoValue && Object.keys(scamInfoValue).length > 1 && ScamInfo.isScam(scamInfoValue) ? scamInfoValue : null;
  }
}
