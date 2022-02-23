import { Type } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';

export function BaseResolver<T extends Type<unknown>>(classRef: T): any {
  @Resolver({ isAbstract: true })
  abstract class BaseResolverHost {}
  return BaseResolverHost;
}
