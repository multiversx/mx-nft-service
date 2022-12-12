import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';
import { MarketplaceEntity } from 'src/db/marketplaces';
import { NftTypeEnum } from 'src/modules/assets/models';
import {
  DEADRARE_KEY,
  ELRONDNFTSWAP_KEY,
  FRAMEIT_KEY,
  XOXNO_KEY,
} from 'src/utils/constants';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
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

  acceptedPaymentIdentifiers: string[];

  @Field(() => [Token], { nullable: true })
  acceptedPaymentTokens: Token[];

  @Field(() => [String], { nullable: true })
  acceptedCollectionIdentifiers: string[];

  @Field({ nullable: true })
  isPaused: boolean;

  lastIndexTimestamp?: number;

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
    if (!entity || Object.keys(entity).length <= 0) {
      return null;
    }
    return new Marketplace({
      address: entity.address,
      name: entity.name,
      acceptedPaymentIdentifiers: entity.acceptedPaymentTokens
        ? entity.acceptedPaymentTokens.split(',').filter((i) => i)
        : null,
      url: Marketplace.getMarketplaceUrl(
        identifier,
        entity,
        id,
        marketplaceAuctionId,
        nftType,
      ),
      key: entity.key,
      type: entity.type,
      lastIndexTimestamp: entity.lastIndexTimestamp,
    });
  }

  private static getMarketplaceUrl(
    identifier: string,
    entity: MarketplaceEntity,
    id: number,
    marketplaceAuctionId: number,
    nftType?: NftTypeEnum,
  ) {
    if (identifier) {
      switch (entity.key) {
        case XOXNO_KEY:
          return marketplaceAuctionId &&
            nftType === NftTypeEnum.SemiFungibleESDT
            ? `${entity.url}${identifier}-${marketplaceAuctionId}`
            : `${entity.url}${identifier}`;

        case ELRONDNFTSWAP_KEY:
          const { collection, nonce } =
            getCollectionAndNonceFromIdentifier(identifier);
          return marketplaceAuctionId
            ? `${entity.url}${marketplaceAuctionId}/${collection}/${parseInt(
                nonce,
              )}`
            : `${entity.url}${identifier}`;

        case FRAMEIT_KEY:
          return marketplaceAuctionId
            ? `${entity.url}${identifier}/${marketplaceAuctionId}`
            : entity.url;

        case DEADRARE_KEY:
          return `${entity.url}${identifier}`;
        default:
          let url = identifier ? `${entity.url}${identifier}` : entity.url;
          if (entity.type === MarketplaceTypeEnum.Internal) {
            url = identifier && id ? `${url}/auction/${id}` : url;
          }
          return url;
      }
    }

    return entity.url;
  }

  static fromEntityForXoxno(
    entity: MarketplaceEntity,
    identifier: string,
    marketplaceAuctionId: number,
    nftType: NftTypeEnum,
  ) {
    let url = identifier ? `${entity.url}${identifier}` : entity.url;

    if (marketplaceAuctionId && nftType === NftTypeEnum.SemiFungibleESDT) {
      url = marketplaceAuctionId ? `${url}-${marketplaceAuctionId}` : url;
    }
    if (!entity || Object.keys(entity).length <= 0) {
      return null;
    }
    return new Marketplace({
      address: entity.address,
      name: entity.name,
      url: url,
      key: entity.key,
      type: entity.type,
    });
  }

  static fromEntityForElrondSwap(
    entity: MarketplaceEntity,
    collection: string,
    marketplaceAuctionId: number,
    nonce: number,
  ) {
    let url = marketplaceAuctionId
      ? `${entity.url}${marketplaceAuctionId}/${collection}/${nonce}`
      : entity.url;
    if (!entity || Object.keys(entity).length <= 0) {
      return null;
    }
    return new Marketplace({
      address: entity.address,
      name: entity.name,
      url: url,
      key: entity.key,
      type: entity.type,
    });
  }
}
