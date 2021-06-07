import { Test, TestingModule } from '@nestjs/testing';
import { AuctionsService } from '../../modules/auctions/auctions.service';
import { NftMarketplaceAbiService } from '../../modules/auctions/nft-marketplace.abi.service';
import { AuctionsServiceDb } from './auctions.service';

class NftMarketplaceAbiServiceMock {
}

class  AuctionsServiceDbMock {
}

describe('AssetsService', () => {
  let service: AuctionsService;

  const NftMarketplaceAbiServiceProvider = {
    provide: NftMarketplaceAbiService,
    useClass: NftMarketplaceAbiServiceMock,
  };

  const AuctionsServiceDbProvider = {
    provide: AuctionsServiceDb,
    useClass: AuctionsServiceDbMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionsService,
        NftMarketplaceAbiServiceProvider,
        AuctionsServiceDbProvider
      ],
    }).compile();

    service = module.get<AuctionsService>(AuctionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
