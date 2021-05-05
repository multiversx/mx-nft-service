import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenEntity } from './token.entity';

@Injectable()
export class TokensServiceDb {
  constructor(
    @InjectRepository(TokenEntity)
    private tokensRepository: Repository<TokenEntity>,
  ) {}

  async getTokens(): Promise<TokenEntity[]> {
    return await this.tokensRepository.find();
  }

  async getToken(_id: number): Promise<TokenEntity[]> {
    return await this.tokensRepository.find({
      select: [
        'id',
        'tokenName',
        'tokenTicker',
        'creationDate',
        'owner',
        'tokenIdentifier',
      ],
      where: [{ id: _id }],
    });
  }

  async getTokensForAddress(address: string): Promise<TokenEntity[]> {
    return await this.tokensRepository.find({
      select: [
        'id',
        'tokenName',
        'tokenTicker',
        'creationDate',
        'owner',
        'tokenIdentifier',
      ],
      where: [{ owner: address }],
    });
  }

  async updateToken(token: TokenEntity) {
    this.tokensRepository.save(token);
  }

  async deleteToken(token: TokenEntity) {
    this.tokensRepository.delete(token);
  }
}
