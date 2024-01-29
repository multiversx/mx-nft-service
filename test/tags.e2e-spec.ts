import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CleanupInterceptor, FieldsInterceptor } from '@multiversx/sdk-nestjs-http';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { getApplication } from './get-application';

describe('TagsResolver', () => {
  let app: INestApplication;

  // beforeEach(async () => {
  //   try{
  //     console.log("Before each creating app.")
  //     app = await getApplication();
  //   } catch (error) {
  //     console.error("Error creating application: ", error)
  //   }
  // });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          dropSchema: true,
          entities: ['src/db/**/*.entity.ts'],
          synchronize: false,
          logging: true,
        })
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );
    await app.init();
  });

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

        const { data } = response.body;
        console.log(data);
        expect(data).toBeDefined();
    });
  });
});
