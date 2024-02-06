import { Resolver, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { ProxyDeployerAbiService } from './proxy-deployer.abi.service';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';

@Resolver(() => String)
export class ProxyDeployerQueriesResolver extends BaseResolver(String) {
  constructor(private minterDeployerService: ProxyDeployerAbiService) {
    super();
  }

  @Mutation(() => [String], { nullable: 'itemsAndList' })
  @UseGuards(JwtOrNativeAuthGuard)
  async xBulkDeployedContracts(@AuthUser() user: UserAuthResult): Promise<string[]> {
    return await this.minterDeployerService.getDeployedContractsForAddressAndTemplate(user.address, process.env.TEMPLATE_BULK_ADDRESS);
  }
}
