import { Test, TestingModule } from '@nestjs/testing';
import { OrdersServiceDb } from './orders.service';

class OrderEntityRepositoryMock {

}

describe('OrdersService', () => {
  let service: OrdersServiceDb;

  const OrderEntityRepositoryProvider = {
    provide: 'OrderEntityRepository',
    useClass: OrderEntityRepositoryMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersServiceDb,
        OrderEntityRepositoryProvider
      ],
    }).compile();

    service = module.get<OrdersServiceDb>(OrdersServiceDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
