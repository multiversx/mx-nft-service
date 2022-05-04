import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Campaign, CampaignsResponse } from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MintPrice } from './models/MintPrice.dto';
import { Tier } from './models/Tier.dto';
import { TierDetail } from './models/TierDetails.dto';

@Resolver(() => Campaign)
export class CampaignsQueriesResolver extends BaseResolver(Campaign) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Query(() => CampaignsResponse)
  async campaigns(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    // const col = await this.nftMinterService.getCampaigns();
    // console.log(col);
    return PageResponse.mapResponse<Campaign>(
      [
        new Campaign({
          availableNfts: 49,
          totalNfts: 50,
          campaignId: 'MinterTest',
          collectionHash: 'QmfJu9u5dD2Qnhn84w8gUiCxh52CVafcKSCkMGmZYnKyot',
          collectionName: 'MinterCol',
          collectionTicker: 'MINTER_676567',
          startDate: 1651578792,
          endDate: 1651665192,
          mediaType: 'png',
          minterAddress:
            'erd1qqqqqqqqqqqqqpgq6g4sc89e73ztsd3aehcgxduj340ra5fru00s9d2x7s',
          royalties: '1000',
          tiers: [
            new Tier({
              availableNfts: 19,
              totalNfts: 20,
              mintPrice: new MintPrice({
                amount: '100000000000000',
                token: 'EGLD',
              }),
              tierName: 'Silver',
              details: [new TierDetail({ info: 'info info info' })],
            }),
            new Tier({
              availableNfts: 30,
              totalNfts: 30,
              mintPrice: new MintPrice({
                amount: '1000000000000000',
                token: 'EGLD',
              }),
              tierName: 'Gold',
              details: [
                new TierDetail({ info: 'info info info' }),
                new TierDetail({ info: 'gold gold gold' }),
              ],
            }),
          ],
        }),
        new Campaign({
          availableNfts: 100,
          totalNfts: 100,
          campaignId: 'MinterTest2',
          collectionHash: 'QmfJu9u5dD2Qnhn84w8gUiCxh52CVafcKSCkMGmZYnKyot',
          collectionName: 'MinterCol2',
          collectionTicker: 'MINTER2_676567',
          startDate: 1651578792,
          endDate: 1651665192,
          mediaType: 'png',
          minterAddress:
            'erd1qqqqqqqqqqqqqpgq6g4sc89e73ztsd3aehcgxduj340ra5fru00s9d2x7s',
          royalties: '1000',
          tiers: [
            new Tier({
              availableNfts: 100,
              totalNfts: 100,
              mintPrice: new MintPrice({
                amount: '1000000000000000',
                token: 'EGLD',
              }),
              tierName: 'Main',
              details: [new TierDetail({ info: 'info info info' })],
            }),
          ],
        }),
      ],
      pagination,
      2,
      offset,
      limit,
    );
  }
}
