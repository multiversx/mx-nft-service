import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { OfferStatusEnum } from './Offer-status.enum';
import { Asset, Price } from '../../assets/models';
import { DateUtils } from 'src/utils/date-utils';
import { Account } from 'src/modules/account-stats/models';
import { OfferEntity } from 'src/db/offers';

@ObjectType()
export class Offer {
  @Field(() => ID)
  id: number;

  @Field()
  identifier: string;

  @Field(() => String, { nullable: true })
  quantity: string;

  @Field(() => String)
  ownerAddress: string;

  @Field(() => Account, { nullable: true })
  owner: Account;

  @Field(() => Asset, { nullable: true })
  asset: Asset;

  @Field(() => Price)
  price: Price;

  @Field(() => OfferStatusEnum)
  status: OfferStatusEnum;

  @Field(() => Int, { nullable: true })
  creationDate: number;

  @Field(() => Int, { nullable: true })
  endDate: number;

  @Field(() => String)
  marketplaceKey: string;

  constructor(init?: Partial<Offer>) {
    Object.assign(this, init);
  }

  static fromEntity(offer: OfferEntity) {
    return offer
      ? new Offer({
          id: offer.id,
          ownerAddress: offer.ownerAddress,
          quantity: offer.boughtTokensNo,
          price: new Price({
            amount: offer.priceAmount,
            nonce: offer.priceNonce,
            token: offer?.priceToken,
            timestamp: DateUtils.getTimestamp(offer.creationDate),
          }),
          status: offer.status,
          creationDate: DateUtils.getTimestamp(offer.creationDate),
          endDate: offer.endDate,
          identifier: offer.identifier,
          marketplaceKey: offer.marketplaceKey,
        })
      : null;
  }
}
