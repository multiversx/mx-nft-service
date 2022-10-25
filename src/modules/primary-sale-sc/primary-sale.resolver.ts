import {
  Resolver,
  Args,
  Mutation,
  Query,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { BuyTicketsArgs, ClaimTicketsArgs } from './models';
import { PrimarySaleService } from './primary-sale.service';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { User } from '../auth/user';
import { ConfigureCollectionArgs } from './models/ConfigureCollectionForSaleArgs';
import { SetSaleClaimPeriodArgs } from './models/SetSaleAndClaimTimePeriodArgs';
import { PrimarySale } from './models/PrimarySale.dto';
import { PrimarySaleFilter } from './models/Primary-sale.Filter';
import { PrimarySaleTime } from './models/PrimarySaleTime';

@Resolver(() => PrimarySale)
export class PrimarySaleResolver extends BaseResolver(PrimarySale) {
  constructor(private primarySaleService: PrimarySaleService) {
    super();
  }

  @Query(() => PrimarySale)
  async primarySale(
    @Args({ name: 'filters', type: () => PrimarySaleFilter })
    filters: PrimarySaleFilter,
  ): Promise<PrimarySale> {
    return await this.primarySaleService.getStatus(filters.collectionName);
  }

  @ResolveField('price', () => String)
  async price(@Parent() sale: PrimarySale) {
    const { collectionIdentifier } = sale;
    const pricePerTicket = await this.primarySaleService.getPricePerTicket(
      collectionIdentifier,
    );
    return pricePerTicket || 0;
  }

  @ResolveField(() => Int)
  async maxUnitsPerWallet(@Parent() sale: PrimarySale) {
    const { collectionIdentifier } = sale;

    const maxNftsPerWallet = await this.primarySaleService.getMaxNftPerWallet(
      collectionIdentifier,
    );
    return maxNftsPerWallet || 0;
  }

  @ResolveField(() => String)
  async paymentToken(@Parent() sale: PrimarySale) {
    return 'EGLD';
  }

  @ResolveField(() => PrimarySaleTime)
  async saleTime(@Parent() sale: PrimarySale) {
    const { collectionIdentifier } = sale;
    const saleTime = await this.primarySaleService.getTimestamps(
      collectionIdentifier,
    );

    return saleTime;
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async buyHolorideTicket(
    @Args('input', { type: () => BuyTicketsArgs })
    input: BuyTicketsArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.buyTicket(user.publicKey, input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async claimTicket(
    @Args('input', { type: () => ClaimTicketsArgs })
    input: ClaimTicketsArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.claim(user.publicKey, input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async configureCollection(
    @Args('input', { type: () => ConfigureCollectionArgs })
    input: ConfigureCollectionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.configureCollection(
      user.publicKey,
      input,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async setSaleClaimPeriod(
    @Args('input', { type: () => SetSaleClaimPeriodArgs })
    input: SetSaleClaimPeriodArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.setSaleTime(user.publicKey, input);
  }
}
