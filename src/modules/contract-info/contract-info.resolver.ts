import { Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { elrondConfig } from 'src/config';
import { NftMarketplaceAbiService } from '../auctions';
import { ContractInfo } from './models/Contract-Info.dto';

@Resolver(() => ContractInfo)
export class ContractInfoResolver {
  constructor(private nftAbiService: NftMarketplaceAbiService) {}

  @Query(() => ContractInfo)
  async contractInfo(): Promise<ContractInfo> {
    return new ContractInfo({ address: elrondConfig.nftMarketplaceAddress });
  }

  @ResolveField(() => String)
  async marketplaceCutPercentage(@Parent() contractInfo: ContractInfo) {
    const { address } = contractInfo;

    return address ? await this.nftAbiService.getCutPercentage(address) : null;
  }

  @ResolveField(() => Boolean)
  async isPaused(@Parent() contractInfo: ContractInfo) {
    const { address } = contractInfo;
    return address ? await this.nftAbiService.getIsPaused(address) : null;
  }
}
