import { createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthUser = createParamDecorator((key, req) => {
  let authUser = req.args[0]?.auth;
  if (!authUser) {
    const ctx = GqlExecutionContext.create(req);
    authUser = ctx.getContext().req?.auth;
  }

  if (!authUser) {
    return undefined;
  }

  if (key === undefined) {
    return authUser;
  }

  return authUser[key];
});
