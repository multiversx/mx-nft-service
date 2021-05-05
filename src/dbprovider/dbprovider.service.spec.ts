import { Test, TestingModule } from '@nestjs/testing';
import { DbproviderService } from './dbprovider.service';

describe('DbproviderService', () => {
  let service: DbproviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbproviderService],
    }).compile();

    service = module.get<DbproviderService>(DbproviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
