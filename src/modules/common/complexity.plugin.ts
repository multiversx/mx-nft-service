import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import { GraphQLError, GraphQLSchema } from 'graphql';
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from 'graphql-query-complexity';
import { constants } from 'src/config';
import { ApolloServerPlugin, GraphQLRequestListener, GraphQLServerContext } from '@apollo/server';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin<any> {
  private schema: GraphQLSchema;
  constructor() {}
  async serverWillStart(service: GraphQLServerContext) {
    this.schema = service.schema;
  }

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    const maxComplexity = constants.complexityLevel;
    const schema = this.schema;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
        });
        if (complexity > maxComplexity) {
          throw new GraphQLError(`Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`);
        }
      },
    };
  }
}
