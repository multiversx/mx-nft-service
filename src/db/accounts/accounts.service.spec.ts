import { Test, TestingModule } from '@nestjs/testing';
import { AccountsServiceDb } from './accounts.service';

class AccountEntityRepositoryMock {

}

describe('AccountsServiceDb', () => {
  let service: AccountsServiceDb;

  const OrderEntityRepositoryProvider = {
    provide: 'AccountEntityRepository',
    useClass: AccountEntityRepositoryMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsServiceDb,
        OrderEntityRepositoryProvider
      ],
    }).compile();

    service = module.get<AccountsServiceDb>(AccountsServiceDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
