import { INestApplication } from '@nestjs/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { CommonModule } from 'src/common.module';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { ComplexityPlugin } from 'src/modules/common/complexity.plugin';
import { AccountsStatsModuleGraph } from 'src/modules/account-stats/accounts-stats.module';
import { AuctionStatusEnum, AuctionTypeEnum } from 'src/modules/auctions/models';
import { AuctionEntity } from 'src/db/auctions/auction.entity';

describe('AccountStatsResolver', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let connection: Connection;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [AccountStatsEntity],
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
        AccountsStatsModuleGraph,
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
      ownerAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
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

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  describe('Query #accountStats', () => {
    it('should return correct data for the accountStats query', async () => {
      const query = `
      query AccountStats($filters: AccountStatsFilter!) {
        accountStats(filters: $filters) {
          address
          auctions
          biddingBalance
          claimable
          collections
          creations
          orders
        }
      }
      `;

      const variables = {
        filters: {
          address: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
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
              accountStats: {
                address: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
                auctions: '1',
                biddingBalance: '0',
                claimable: '0',
                collections: '3',
                creations: '13',
                orders: '0',
              },
            },
          });
        });

      expect(response.body).toBeDefined();
    });
  });
});
