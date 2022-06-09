import { registerEnumType } from '@nestjs/graphql';

export enum TagTypeEnum {
  Nft = 'Nft',
  Auction = 'Auction',
}

registerEnumType(TagTypeEnum, {
  name: 'TagTypeEnum',
});
