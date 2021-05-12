import { Test, TestingModule } from '@nestjs/testing';
import { AccountsServiceDb } from './accounts.service';

describe('AccountsServiceDb', () => {
  let service: AccountsServiceDb;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsServiceDb],
    }).compile();

    service = module.get<AccountsServiceDb>(AccountsServiceDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
