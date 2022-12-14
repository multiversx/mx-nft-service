import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const request = gqlCtx.getContext().req;
    return request.user;
  },
);

export declare class UserAuthResult {
  constructor(result?: Partial<UserAuthResult>);
  issued: number;
  expires: number;
  address: string;
  host: string;
  extraInfo?: any;
}
