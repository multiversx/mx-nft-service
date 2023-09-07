import { INestApplication } from '@nestjs/common';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { CollectionsStatsService } from 'src/modules/collection-stats/collections-stats.service';
import * as request from 'supertest';
import { getApplication } from './get-application';
describe('CollectionStatsResolver', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Query #collectionStats', () => {
    const mutation = () => `
      { collectionStats(filters: { identifier: "test" }) {
        identifier
        activeAuctions
        auctionsEnded
        items
        maxPrice
        minPrice
        saleAverage
        volumeTraded
      }
    }
    `;

    it('get stats for collection', async () => {
      const collectionStatsService = app.get<CollectionsStatsService>(CollectionsStatsService);
      jest.spyOn(collectionStatsService, 'getStats').mockResolvedValue(
        new CollectionStatsEntity({
          activeAuctions: 2,
          auctionsEnded: 4,
          maxPrice: '1',
          minPrice: '111111111111',
          saleAverage: '12',
          volumeTraded: '21',
        }),
      );
      jest.spyOn(collectionStatsService, 'getItemsCount').mockResolvedValue({ key: 'test', value: '4' });

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation(),
        })
        .expect((res) => {
          expect(res.body).toEqual({
            data: {
              collectionStats: {
                identifier: 'test',
                activeAuctions: 2,
                auctionsEnded: 4,
                maxPrice: '1000000000000000000',
                minPrice: '111111111111',
                saleAverage: '12000000000000000000',
                volumeTraded: '21000000000000000000',
                items: 4,
              },
            },
          });
        });
    });
  });
});
