import { INestApplication, forwardRef } from '@nestjs/common';
import * as request from 'supertest';
//import { CleanupInterceptor, FieldsInterceptor } from '@multiversx/sdk-nestjs-http';
import { Test, TestingModule} from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
//import { PersistenceService } from 'src/common/persistence/persistence.service';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { AppModule } from 'src/app.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
//import { getApplication } from './get-application';

describe('TagsResolver', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // beforeAll(async () => {
  //   try{
  //     console.log("Before each creating app.")
  //     app = await getApplication();
  //   } catch (error) {
  //     console.error("Error creating application: ", error)
  //   }
  // });

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        // TypeOrmModule.forRoot({
        //   type: "sqlite",
        //   database: ":memory:",
        //   dropSchema: true,
        //   entities: ['src/db/**/*.entity.js'],
        //   synchronize: false,
        //   logging: false,
        // }),
        GraphQLModule.forRoot<ApolloDriverConfig>({ driver: ApolloDriver, playground: false, autoSchemaFile: 'schema.gql' }),
        forwardRef(() => AppModule),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    const tagsRepository = moduleFixture.get(getRepositoryToken(TagEntity));
    const testTag = new TagEntity();
    testTag.tag = 'newTag';
    await tagsRepository.save(testTag);
  }, 10000);

  afterAll(async () => {
    await app.close();
    const tagsRepository = moduleFixture.get(getRepositoryToken(TagEntity));
    await tagsRepository.clear();
  }, 10000);

  describe('Query #tags', () => {
    it('should return correct data for the tags query', async () => {
        const query = `
            query Query($filters: TagsFilter!) {
                tags(filters: $filters) {
                 edges {
                    node {
                      count
                      tag
                    }
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
        expect(data.tags.edges.length).toBeGreaterThan(0);
    });
  });
});
