import { Test } from '@nestjs/testing';
import { ElrondElasticService } from 'src/common';
import { ElrondElasticServiceMock } from 'src/common/services/elrond-communication/elrond-elastic.service.mock';
import { AssetsHistoryService } from './assets-history.service';

describe.skip('AssetsHistoryService', () => {
  let service: AssetsHistoryService;
  const ElrondElasticServiceProvider = {
    provide: ElrondElasticService,
    useClass: ElrondElasticServiceMock,
  };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ElrondElasticServiceProvider, AssetsHistoryService],
    }).compile();

    service = moduleRef.get<AssetsHistoryService>(AssetsHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
