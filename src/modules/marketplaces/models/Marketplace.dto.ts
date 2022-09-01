import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MarketplaceEntity } from 'src/db/marketplaces';
import { NftTypeEnum } from 'src/modules/assets/models';
import { MarketplaceTypeEnum } from './MarketplaceType.enum';
@ObjectType()
export class Marketplace {
  @Field(() => ID)
  key: string;

  @Field(() => String)
  address: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  url: string;

  @Field(() => MarketplaceTypeEnum)
  type: MarketplaceTypeEnum;

  @Field({ nullable: true })
  marketplaceCutPercentage: string;

  @Field({ nullable: true })
  isPaused: boolean;

  constructor(init?: Partial<Marketplace>) {
    Object.assign(this, init);
  }

  static fromEntity(
    entity: MarketplaceEntity,
    identifier?: string,
    id?: number,
    marketplaceAuctionId?: number,
    nftType?: NftTypeEnum,
  ) {
    let url = identifier ? `${entity.url}${identifier}` : entity.url;
    if (entity.type === MarketplaceTypeEnum.Internal) {
      url = identifier && id ? `${url}/auction/${id}` : url;
    }

    console.log({ entity, marketplaceAuctionId, nftType });
    if (
      entity.key === 'xoxno' &&
      marketplaceAuctionId &&
      nftType === NftTypeEnum.SemiFungibleESDT
    ) {
      url = identifier && id ? `${url}-${id}` : url;
    }
    return entity && Object.keys(entity).length > 0
      ? new Marketplace({
          address: entity.address,
          name: entity.name,
          url: url,
          key: entity.key,
          type: entity.type,
        })
      : null;
  }
}
