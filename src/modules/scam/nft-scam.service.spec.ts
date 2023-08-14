import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MxElasticService, MxApiService } from 'src/common';
import { CommonModule } from 'src/common.module';
import { PluginService } from 'src/common/pluggins/plugin.service';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { AssetByIdentifierService } from '../assets';
import { ApiConfigModule } from '../common/api-config/api.config.module';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamService } from './nft-scam.service';

describe('NftScamService', () => {
  let mockdocumentDbService: DocumentDbService;
  let mockassetByIdentifierService: AssetByIdentifierService;
  let mocknftScamElasticService: NftScamElasticService;
  let mockmxElasticService: MxElasticService;
  let mockmxApiService: MxApiService;
  let mockpluginsService: PluginService;
  let mockcacheEventsPublisher: CacheEventsPublisherService;
  let mocklogger: Logger;
  let service: NftScamService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      // imports: [CommonModule],
      providers: [
        NftScamService,
        {
          provide: DocumentDbService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: AssetByIdentifierService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: NftScamElasticService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: MxElasticService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: MxApiService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: PluginService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: CacheEventsPublisherService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<NftScamService>(NftScamService);
  });

  // beforeEach(() => {
  //   jest.restoreAllMocks();
  // });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
