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
import { Jwt, JwtAuthenticateGuard } from '@elrondnetwork/erdnest';

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
  @UseGuards(JwtAuthenticateGuard)
  async myTickets(
    @Args({ name: 'collectionIdentifier', type: () => String })
    collectionIdentifier: string,
    @Jwt('address') address: string,
  ): Promise<TicketInfo[]> {
    return await this.primarySaleService.getMyTickets(
      collectionIdentifier,
      address,
    );
  }

  @Query(() => Boolean)
  @UseGuards(JwtAuthenticateGuard)
  async hasClaimedTickets(
    @Args({ name: 'collectionIdentifier', type: () => String })
    collectionIdentifier: string,
    @Jwt('address') address: string,
  ): Promise<boolean> {
    return await this.primarySaleService.hasClaimedTickets(
      collectionIdentifier,
      address,
    );
  }

  @Query(() => WhitelistedInfo)
  @UseGuards(JwtAuthenticateGuard)
  async isWhitelisted(
    @Jwt('address') address: string,
  ): Promise<{ isWhitelisted: boolean; message: string }> {
    return await this.primarySaleService.isWhitelisted(address);
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
  @UseGuards(JwtAuthenticateGuard)
  async buyTickets(
    @Args('input', { type: () => BuyTicketsArgs })
    input: BuyTicketsArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.buyTicket(address, input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async claimTicket(
    @Args('input', { type: () => ClaimTicketsArgs })
    input: ClaimTicketsArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    return await this.primarySaleService.claim(address, input);
  }
}
