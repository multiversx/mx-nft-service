import { Test, TestingModule } from '@nestjs/testing';
import { FollowersServiceDb } from './followers.service';

describe('FollowersService', () => {
  let service: FollowersServiceDb;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowersServiceDb],
    }).compile();

    service = module.get<FollowersServiceDb>(FollowersServiceDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
