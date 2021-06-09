import { Test, TestingModule } from '@nestjs/testing';
import { FollowersServiceDb } from './followers.service';

class FollowerEntityRepositoryMock {

}

describe('FollowersService', () => {
  let service: FollowersServiceDb;

  const FollowerEntityRepositoryProvider = {
    provide: 'FollowerEntityRepository',
    useClass: FollowerEntityRepositoryMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowersServiceDb,
        FollowerEntityRepositoryProvider
      ],
    }).compile();

    service = module.get<FollowersServiceDb>(FollowersServiceDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
