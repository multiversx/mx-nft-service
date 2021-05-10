import { Test, TestingModule } from '@nestjs/testing';
import { AssetsServiceDb } from './assets.service';

describe('AssetsService', () => {
  let service: AssetsServiceDb;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsServiceDb],
    }).compile();

    service = module.get<AssetsServiceDb>(AssetsServiceDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
