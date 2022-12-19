import { registerEnumType } from '@nestjs/graphql';

export enum UpdateNftTraitsResponse {
  NftTraitsValid = 'NftTraitsValid',
  NftTraitsUpdated = 'NftTraitsUpdated',
  CollectionTraitsUpdated = 'CollectionTraitsUpdated',
}

registerEnumType(UpdateNftTraitsResponse, {
  name: 'UpdateNftTraitsResponse',
});
