import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { BuyTicketsArgs, ClaimTicketsArgs } from './models';
import { PrimarySaleService } from './primary-sale.service';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { User } from '../auth/user';
import { ConfigureCollectionArgs } from './models/ConfigureCollectionForSaleArgs';
import { SetSaleClaimPeriodArgs } from './models/SetSaleAndClaimTimePeriodArgs';

@Resolver(() => TransactionNode)
export class PrimarySaleResolver extends BaseResolver(TransactionNode) {
  constructor(private primarySaleService: PrimarySaleService) {
    super();
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
