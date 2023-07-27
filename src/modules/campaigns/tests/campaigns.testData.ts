import { CampaignEntity } from 'src/db/campaigns';
import { TierEntity } from 'src/db/campaigns/tiers.entity';
import { Campaign } from '../models';
import { CampaignCollection } from '../models/CampaignCollection';
import { TierStatusEnum } from '../models/CampaignStatus.enum';
import { MintPrice } from '../models/MintPrice.dto';
import { Tier } from '../models/Tier.dto';

export const getCampaignsInputMockData: [Campaign[], number] = [
  [
    new Campaign({
      campaignId: 'campaing1',
      description: 'name',
      minterAddress: 'address1',
      maxNftsPerTransaction: 7,
    }),
    new Campaign({
      campaignId: 'campaing1',
      description: 'name',
      minterAddress: 'address12',
      maxNftsPerTransaction: 7,
    }),
    new Campaign({
      minterAddress: 'address2',
      campaignId: 'campaing2',
      description: 'name3',
      maxNftsPerTransaction: 3,
    }),
  ],
  2,
];

export const getCampaignsMockData = [
  {
    brand_id: {
      type: 'Buffer',
      data: [67, 97, 109, 112, 97, 105, 103, 110],
    },
    nft_token_id: 'CAMP-3bd1c7',
    brand_info: {
      collection_hash: [
        '81',
        '109',
        '88',
        '74',
        '69',
        '99',
        '83',
        '119',
        '107',
        '68',
        '50',
        '72',
        '115',
        '106',
        '71',
        '65',
        '49',
        '57',
        '119',
        '111',
        '84',
        '112',
        '101',
        '109',
        '54',
        '52',
        '83',
        '107',
        '71',
        '53',
        '88',
        '81',
        '121',
        '115',
        '49',
        '84',
        '68',
        '81',
        '80',
        '97',
        '70',
        '118',
        '82',
        '50',
        '81',
        '120',
      ],
      token_display_name: {
        type: 'Buffer',
        data: [67, 97, 109, 112, 97, 105, 103, 110],
      },
      media_type: {
        type: 'Buffer',
        data: [112, 110, 103],
      },
      royalties: '1000',
      mint_period: {
        start: '1688116254',
        end: '1688375454',
      },
      whitelist_expire_timestamp: '1688116254',
    },
    tier_info_entries: [
      {
        tier: {
          type: 'Buffer',
          data: [70, 105, 114, 115, 116, 32, 116, 105, 101, 114],
        },
        total_nfts: '150',
        available_nfts: '109',
        mint_price: {
          token_id: 'EGLD',
          amount: '10000000000000000',
        },
      },
    ],
  },
  {
    brand_id: {
      type: 'Buffer',
      data: [67, 97, 109, 112, 97, 105, 103, 110],
    },
    nft_token_id: 'CAMP-3bd1c7',
    brand_info: {
      collection_hash: [
        '81',
        '109',
        '88',
        '74',
        '69',
        '99',
        '83',
        '119',
        '107',
        '68',
        '50',
        '72',
        '115',
        '106',
        '71',
        '65',
        '49',
        '57',
        '119',
        '111',
        '84',
        '112',
        '101',
        '109',
        '54',
        '52',
        '83',
        '107',
        '71',
        '53',
        '88',
        '81',
        '121',
        '115',
        '49',
        '84',
        '68',
        '81',
        '80',
        '97',
        '70',
        '118',
        '82',
        '50',
        '81',
        '120',
      ],
      token_display_name: {
        type: 'Buffer',
        data: [67, 97, 109, 112, 97, 105, 103, 110],
      },
      media_type: {
        type: 'Buffer',
        data: [112, 110, 103],
      },
      royalties: '1000',
      mint_period: {
        start: '1688116254',
        end: '1688375454',
      },
      whitelist_expire_timestamp: '1688116254',
    },
    tier_info_entries: [
      {
        tier: {
          type: 'Buffer',
          data: [70, 105, 114, 115, 116, 32, 116, 105, 101, 114],
        },
        total_nfts: '150',
        available_nfts: '109',
        mint_price: {
          token_id: 'EGLD',
          amount: '10000000000000000',
        },
      },
    ],
  },
];

export const getSaveCampaignsExpectedResult = [
  new Campaign({
    availableNfts: NaN,
    campaignId: 'name',
    collection: new CampaignCollection({
      collectionHash: 'hash',
      collectionName: 'collectionName',
      collectionTicker: 'ticker',
      royalties: '1000',
    }),
    description: 'description',
    endDate: undefined,
    maxNftsPerTransaction: undefined,
    mediaType: undefined,
    minterAddress: 'address',
    startDate: undefined,
    tiers: [
      new Tier({
        availableNfts: undefined,
        campaignId: 'name',
        mintPrice: new MintPrice({
          amount: '1000000',
          token: undefined,
        }),
        status: TierStatusEnum.Sold,
        tierName: 'address',
        totalNfts: 10,
      }),
    ],
    totalNfts: 10,
    whitelistExpire: undefined,
  }),
  new Campaign({
    availableNfts: NaN,
    campaignId: 'name2',
    collection: new CampaignCollection({
      collectionHash: 'hash2',
      collectionName: 'collectionName2',
      collectionTicker: 'ticker2',
      royalties: '2000',
    }),
    description: 'description2',
    endDate: undefined,
    maxNftsPerTransaction: undefined,
    mediaType: undefined,
    minterAddress: 'address2',
    startDate: undefined,
    tiers: [
      new Tier({
        availableNfts: undefined,
        campaignId: 'name2',
        mintPrice: new MintPrice({
          amount: '2000000',
          token: undefined,
        }),
        status: TierStatusEnum.Sold,
        tierName: 'address2',
        totalNfts: 20,
      }),
    ],
    totalNfts: 20,
    whitelistExpire: undefined,
  }),
];

export const saveCampaignInput = [
  new CampaignEntity({
    minterAddress: 'address',
    campaignId: 'name',
    description: 'description',
    collectionHash: 'hash',
    collectionName: 'collectionName',
    collectionTicker: 'ticker',
    royalties: '1000',
    tiers: [
      new TierEntity({
        tierName: 'address',
        mintPrice: '1000000',
        totalNfts: 10,
      }),
    ],
  }),
  new CampaignEntity({
    minterAddress: 'address2',
    campaignId: 'name2',
    description: 'description2',
    collectionHash: 'hash2',
    collectionName: 'collectionName2',
    collectionTicker: 'ticker2',
    royalties: '2000',
    tiers: [
      new TierEntity({
        tierName: 'address2',
        mintPrice: '2000000',
        totalNfts: 20,
      }),
    ],
  }),
];

export const getCampaignsExpectedList = [
  new Campaign({
    campaignId: 'campaing1',
    description: 'name',
    minterAddress: 'address1',
    maxNftsPerTransaction: 7,
  }),
  new Campaign({
    campaignId: 'campaing1',
    description: 'name',
    minterAddress: 'address12',
    maxNftsPerTransaction: 7,
  }),
  new Campaign({
    minterAddress: 'address2',
    campaignId: 'campaing2',
    description: 'name3',
    maxNftsPerTransaction: 3,
  }),
];
