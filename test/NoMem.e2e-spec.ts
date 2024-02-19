import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getApplication } from './get-application';

describe('TagsResolver', () => {
  let app: INestApplication;

  beforeEach(async () => {
      console.log("Before each creating app.")
      app = await getApplication();
  });

//   beforeEach(async () => {
//     const moduleRef = await Test.createTestingModule({
//       imports: [
//         TypeOrmModule.forRoot({
//           type: "sqlite",
//           database: ":memory:",
//           dropSchema: true,
//           entities: ['src/db/**/*.entity.ts'],
//           synchronize: false,
//           logging: true,
//         })
//       ],
//     }).compile();

//     app = moduleRef.createNestApplication();
//     app.useGlobalInterceptors(
//       new FieldsInterceptor(),
//       new CleanupInterceptor(),
//     );
//     await app.init();
//   });

  afterEach(async () => {
    await app.close();
  });

  describe('Query #tags', () => {
    it('should return correct data for the tags query', async () => {
        const query = `
            query Query($filters: TagsFilter!) {
                tags(filters: $filters) {
                 edges {
                    cursor
                    node {
                    count
                    tag
                    }
                }
                pageData {
                    count
                    limit
                    offset
                }
                pageInfo {
                    endCursor
                    hasNextPage
                    hasPreviousPage
                    startCursor
                }
                }
            }
        `;

        const variables = {
            filters: {
                tagType: 'Nft'
            },
        };

        const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables,
        })
        .expect(200);

        expect(response.body.data.tags).toBeDefined();
    });
  });
});
