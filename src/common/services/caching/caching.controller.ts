import { Body, Controller, Delete, Get, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { DeleteCacheKeysInput } from './entities/deleteCacheInput';
import { SetCacheKeyInput } from './entities/setCacheInput';
import { GetCacheKeysInput } from './entities/getCacheInput';
import { JwtOrNativeAuthGuard } from 'src/modules/auth/jwt.or.native.auth-guard';
import { GqlAdminAuthGuard } from 'src/modules/auth/gql-admin.auth-guard';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from 'src/modules/rabbitmq/cache-invalidation/events/changed.event';
import { CacheService } from '@multiversx/sdk-nestjs-cache';

@Controller()
export class CachingController {
  constructor(private readonly cacheService: CacheService, private readonly cacheEventsPublisherService: CacheEventsPublisherService) {}

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Get('/caching')
  async getCacheKeys(@Body() input: GetCacheKeysInput, @Res() res: Response): Promise<any> {
    try {
      let values: any[] = [];

      for (let i = 0; i < input.keys.length; i++) {
        values.push(await this.cacheService.get<any>(input.keys[i]));
      }
      return res.status(200).send(values);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Post('/caching')
  async setCacheKey(@Body() input: SetCacheKeyInput, @Res() res: Response): Promise<Response> {
    try {
      await this.publishSetCacheKeyForClientEvent(input);
      return res.status(HttpStatus.CREATED).send();
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Delete('/caching')
  async deleteCacheKeys(@Body() input: DeleteCacheKeysInput, @Res() res: Response): Promise<Response> {
    try {
      await this.publishDeleteCacheKeysFromClientEvent(input);
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }

  private async publishDeleteCacheKeysFromClientEvent(input: DeleteCacheKeysInput) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: input.keys,
        type: CacheEventTypeEnum.DeleteCacheKeys,
      }),
    );
  }

  private async publishSetCacheKeyForClientEvent(input: SetCacheKeyInput) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: input.key,
        type: CacheEventTypeEnum.SetCacheKey,
        extraInfo: {
          value: input.value,
          ttl: input.ttl.toString(),
        },
      }),
    );
  }
}
