import { registerEnumType } from '@nestjs/graphql';

export enum UpdateNfttraitsResponse {
  NftTraitsValid = 'NftTraitsValid',
  NftTraitsUpdated = 'NftTraitsUpdated',
  CollectionTraitsUpdated = 'CollectionTraitsUpdated',
}

registerEnumType(UpdateNfttraitsResponse, {
  name: 'UpdateNfttraitsResponse',
});
