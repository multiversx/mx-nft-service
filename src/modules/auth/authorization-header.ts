import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthorizationHeader = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const context = GqlExecutionContext.create(ctx);
  const { req } = context.getContext();
  return req.headers.authorization;
});
