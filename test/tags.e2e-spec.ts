import { INestApplication, forwardRef } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TagsModuleGraph } from 'src/modules/tags/tags.module';
import { CommonModule } from 'src/common.module';
import { ComplexityPlugin } from 'src/modules/common/complexity.plugin';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AuctionStatusEnum, AuctionTypeEnum } from 'src/modules/auctions/models';
import { OrderEntity } from 'src/db/orders/order.entity';
import { Connection } from 'typeorm';
import { OrderStatusEnum } from 'src/modules/orders/models';

describe('TagsResolver', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let connection: Connection;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [AuctionEntity, OrderEntity, TagEntity],
          synchronize: true,
          logging: false,
        }),
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
          driver: ApolloDriver,
          imports: [CommonModule],
          useFactory: async () => ({
            autoSchemaFile: 'schema.gql',
            introspection: process.env.NODE_ENV !== 'production',
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault(), new ComplexityPlugin()],
            sortSchema: true,
            formatError: (error: GraphQLError) => {
              const graphQLFormattedError: GraphQLFormattedError = {
                ...error,
                message: error.message,
              };
              console.error(graphQLFormattedError);

              return {
                ...graphQLFormattedError,
                extensions: { ...graphQLFormattedError.extensions, exception: null },
              };
            },
          }),
        }),
        TagsModuleGraph,
        CommonModule,
        PersistenceModule,
      ],
    }).compile();

    connection = moduleFixture.get<Connection>(Connection);
    await connection.runMigrations();

    const savedAuction = await connection.getRepository(AuctionEntity).save({
      creationDate: new Date(),
      modifiedDate: new Date(),
      marketplaceAuctionId: 24,
      marketplaceKey: 'holoride',
      collection: 'AGENTS-ad9b3a',
      identifier: 'AGENTS-ad9b3a-0b',
      type: AuctionTypeEnum.Nft,
      ownerAddress: 'erd1jhfd8zulqn8yuqeepkculuk0pyjp6ccez8fw3a0ru0379hz28kcqpwms50',
      nrAuctionedTokens: 2,
      nonce: 42,
      status: AuctionStatusEnum.Running,
      paymentToken: 'EGLD',
      paymentNonce: 0,
      minBid: '7000000000000000',
      maxBid: '0',
      minBidDiff: '7000000000000000',
      startDate: 10,
      endDate: 15,
      tags: 'test',
      blockHash: 'd7f4968fc0730bca82fa7b189e5365c873689c9c5296ca3c3e6e18a2277f9df9',
    });

    await connection.getRepository(OrderEntity).save({
      creationDate: new Date(),
      auctionId: savedAuction.id,
      priceToken: '70000000000000',
      priceAmount: '7000000000000000',
      priceNonce: 0,
      status: OrderStatusEnum.Active,
      ownerAddress: 'erd1jhfd8zulqn8yuqeepkculuk0pyjp6ccez8fw3a0ru0379hz28kcqpwms50',
      priceAmountDenominated: 3.3,
      blockHash: 'd7f4968fc0730bca82fa7b189e5365c873689c9c5296ca3c3e6e18a2277f9df9',
      marketplaceKey: 'holoride',
    });

    await connection.getRepository(TagEntity).save({
      creationDate: new Date(),
      auctionId: savedAuction.id,
      tag: 'test',
    });

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  describe('Query #tags', () => {
    it('should return correct data for the tags query', async () => {
      const query = `
            query Query($filters: TagsFilter!, $pagination: ConnectionArgs) {
                tags(filters: $filters, pagination: $pagination) {
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
          tagType: 'Nft',
        },
        pagination: {
          first: 10,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables,
        })
        .expect((res) => {
          expect(res.body).toEqual({
            data: {
              tags: {
                edges: [
                  {
                    node: {
                      tag: 'multiversx',
                      count: 49500,
                    },
                  },
                  {
                    node: {
                      tag: 'beeser',
                      count: 44445,
                    },
                  },
                  {
                    node: {
                      tag: 'monster squad',
                      count: 18372,
                    },
                  },
                  {
                    node: {
                      tag: 'alien',
                      count: 15271,
                    },
                  },
                  {
                    node: {
                      tag: 'mini monster',
                      count: 15271,
                    },
                  },
                  {
                    node: {
                      tag: 'space robots',
                      count: 8126,
                    },
                  },
                  {
                    node: {
                      tag: 'robot',
                      count: 7795,
                    },
                  },
                  {
                    node: {
                      tag: 'sr-gen1',
                      count: 7795,
                    },
                  },
                  {
                    node: {
                      tag: 'vapor republic',
                      count: 5984,
                    },
                  },
                  {
                    node: {
                      tag: 'greek',
                      count: 5982,
                    },
                  },
                ],
              },
            },
          });
        });

      expect(response.body).toBeDefined();
    });

    it('should return correct data for the tags query (in mem value)', async () => {
      const query = `
          query Query($filters: TagsFilter!, $pagination: ConnectionArgs) {
              tags(filters: $filters, pagination: $pagination) {
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
          tagType: 'Auction',
        },
        pagination: {
          first: 10,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables,
        })
        .expect((res) => {
          expect(res.body).toEqual({
            data: {
              tags: {
                edges: [
                  {
                    node: {
                      tag: 'test',
                      count: 1,
                    },
                  },
                ],
              },
            },
          });
        });

      expect(response.body).toBeDefined();
    });
  });
});
