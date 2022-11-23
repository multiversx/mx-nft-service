import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private gqlSchemaHost: GraphQLSchemaHost) {}

  // OFFICIAL DOCS - ERROR
  async requestDidStart(): Promise<void | GraphQLRequestListener> {
    const maxComplexity = 20;
    const { schema } = this.gqlSchemaHost;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });
        if (complexity > maxComplexity) {
          throw new GraphQLError(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
          );
        }
        console.log('Query Complexity:', complexity);
      },
    };
  }

  // requestDidStart(
  //   requestContext: GraphQLRequestContext<BaseContext>,
  // ): void | GraphQLRequestListener<BaseContext> {
  //   const maxComplexity = 20;
  //   const { schema } = this.gqlSchemaHost;

  //   return {
  //     didResolveOperation({ request, document }) {
  //       const complexity = getComplexity({
  //         schema,
  //         operationName: request.operationName,
  //         query: document,
  //         variables: request.variables,
  //         estimators: [
  //           fieldExtensionsEstimator(),
  //           simpleEstimator({ defaultComplexity: 1 }),
  //         ],
  //       });
  //       if (complexity > maxComplexity) {
  //         throw new GraphQLError(
  //           `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
  //         );
  //       }
  //       console.log('Query Complexity:', complexity);
  //     },
  //   };
  // }
}
