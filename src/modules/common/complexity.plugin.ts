import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLServiceContext,
} from 'apollo-server-plugin-base';
import { GraphQLError, GraphQLSchema } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import { constants } from 'src/config';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  private schema: GraphQLSchema;
  constructor() {}
  async serverWillStart(service: GraphQLServiceContext) {
    this.schema = service.schema;
  }

  async requestDidStart(): Promise<GraphQLRequestListener> {
    const maxComplexity = constants.complexityLevel;
    const schema = this.schema;

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
      },
    };
  }
}
