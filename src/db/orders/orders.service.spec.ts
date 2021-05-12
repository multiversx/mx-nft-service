import { Test, TestingModule } from '@nestjs/testing';
import { OrdersServiceDb } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersServiceDb;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersServiceDb],
    }).compile();

    service = module.get<OrdersServiceDb>(OrdersServiceDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
