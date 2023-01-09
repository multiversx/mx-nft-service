import { Test } from '@nestjs/testing';
import { MxElasticService } from 'src/common';
import { MxElasticServiceMock } from 'src/common/services/mx-communication/mx-elastic.service.mock';
import { AssetsHistoryService } from './assets-history.service';

describe.skip('AssetsHistoryService', () => {
  let service: AssetsHistoryService;
  const MxElasticServiceProvider = {
    provide: MxElasticService,
    useClass: MxElasticServiceMock,
  };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MxElasticServiceProvider, AssetsHistoryService],
    }).compile();

    service = moduleRef.get<AssetsHistoryService>(AssetsHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
