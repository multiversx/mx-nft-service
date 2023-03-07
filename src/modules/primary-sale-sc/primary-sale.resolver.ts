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
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { PrimarySale } from './models/PrimarySale.dto';
import { PrimarySaleFilter } from './models/Primary-sale.Filter';
import { PrimarySaleTime } from './models/PrimarySaleTime';
import { TicketInfo, WhitelistedInfo } from './models/TicketInfo';
import { UserAuthResult } from '../auth/userAuthResult';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';

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

  @Query(() => [TicketInfo])
  @UseGuards(JwtOrNativeAuthGuard)
  async myTickets(
    @Args({ name: 'collectionIdentifier', type: () => String })
    collectionIdentifier: string,
    @AuthUser() user: UserAuthResult,
  ): Promise<TicketInfo[]> {
    return await this.primarySaleService.getMyTickets(
      collectionIdentifier,
      user.address,
    );
  }

  @Query(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  async hasClaimedTickets(
    @Args({ name: 'collectionIdentifier', type: () => String })
    collectionIdentifier: string,
    @AuthUser() user: UserAuthResult,
  ): Promise<boolean> {
    return await this.primarySaleService.hasClaimedTickets(
      collectionIdentifier,
      user.address,
    );
  }

  @Query(() => WhitelistedInfo)
  @UseGuards(JwtOrNativeAuthGuard)
  async isWhitelisted(
    @AuthUser() user: UserAuthResult,
  ): Promise<{ isWhitelisted: boolean; message?: string }> {
    return await this.primarySaleService.isWhitelisted(user.address);
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
    return process.env.HOLORIDE_PAYMENT_TOKEN;
  }

  @ResolveField(() => PrimarySaleTime)
  async saleTime(@Parent() sale: PrimarySale) {
    const { collectionIdentifier } = sale;
    return await this.primarySaleService.getTimestamps(collectionIdentifier);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async buyTickets(
    @Args('input', { type: () => BuyTicketsArgs })
    input: BuyTicketsArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.buyTicket(user.address, input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async claimTicket(
    @Args('input', { type: () => ClaimTicketsArgs })
    input: ClaimTicketsArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.claim(user.address, input);
  }
}
