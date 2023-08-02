import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { WhitelistMinterArgs, Minter } from './models';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { MintersService } from './minters.service';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { WhitelistMinterRequest } from './models/requests/whitelistMinterRequest';
import { DeployMinterArgs } from './models/DeployMinterArgs';
import { DeployMinterRequest } from './models/requests/DeployMinterRequest';
import { MintersDeployerAbiService } from './minters-deployer.abi.service';
import { TransactionNode } from '../common/transaction';

@Resolver(() => Minter)
export class MintersMutationsResolver extends BaseResolver(Minter) {
  constructor(private minterService: MintersService, private minterDeployerService: MintersDeployerAbiService) {
    super();
  }

  @Mutation(() => Minter)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistMinter(@Args('input') input: WhitelistMinterArgs): Promise<Minter> {
    return await this.minterService.whitelistMinter(WhitelistMinterRequest.fromArgs(input));
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployMinter(@Args('input') input: DeployMinterArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployMinter(DeployMinterRequest.fromArgs(input));
  }
}
