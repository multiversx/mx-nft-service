import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { CachingService } from './caching.service';
import { DeleteCacheKeysInput } from './entities/deleteCacheInput';
import { SetCacheKeysInput } from './entities/setCacheInput';
import { GetCacheKeysInput } from './entities/getCacheInput';
import { JwtOrNativeAuthGuard } from 'src/modules/auth/jwt.or.native.auth-guard';
import { GqlAdminAuthGuard } from 'src/modules/auth/gql-admin.auth-guard';

@Controller()
export class CachingController {
  constructor(
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) {}

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Get('/caching')
  async getCacheKeys(
    @Body() input: GetCacheKeysInput,
    @Res() res: Response,
  ): Promise<any> {
    try {
      let values: any[] = [];
      const redisClient = this.cachingService.getClient(input.redisClientName);
      for (let i = 0; i < input.keys.length; i++) {
        values.push(
          await this.cachingService.getCache<any>(redisClient, input.keys[i]),
        );
      }
      return res.send(values);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Post('/caching')
  async setCacheKey(
    @Body() input: SetCacheKeysInput,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.emitSetCacheKeyForClient(input);
      return res.status(HttpStatus.CREATED).send();
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Delete('/caching')
  async deleteCacheKeys(
    @Body() input: DeleteCacheKeysInput,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const client = await this.cachingService.getClient(input.redisClientName);

      if (input.localOnly) {
        this.emitDeleteCacheKeys(input.keys);
      } else {
        if (!input.redisClientName) {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .send('redisClientName not provided');
        }

        this.emitDeleteCacheKeysFromClient(input);
        await Promise.all([
          input.keys.map((key) =>
            this.cachingService.deleteInCache(client, key),
          ),
        ]);
      }

      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }

  private emitDeleteCacheKeys(keys: string[]) {
    this.clientProxy.emit('deleteCacheKeys', keys);
  }

  private emitDeleteCacheKeysFromClient(input: DeleteCacheKeysInput) {
    this.clientProxy.emit('deleteCacheKeysFromClient', input);
  }

  private emitSetCacheKeyForClient(input: SetCacheKeysInput) {
    this.clientProxy.emit('setCacheKeyForClient', input);
  }
}
