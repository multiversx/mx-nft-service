import { ObjectType } from '@nestjs/graphql';
import { AssetActionEnum } from 'src/modules/assets/models';
import { AssetOfferEnum } from 'src/modules/assets/models/AssetOfferEnum';

@ObjectType()
export class ReindexGenericSummary {
  action: AssetActionEnum | AssetOfferEnum;
  blockHash?: string;
  timestamp: number;
  address: string;
  sender: string;

  constructor(init?: Partial<ReindexGenericSummary>) {
    Object.assign(this, init);
  }
}
