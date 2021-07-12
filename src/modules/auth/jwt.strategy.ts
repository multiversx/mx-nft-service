import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticationError } from 'apollo-server-errors';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  async authenticate(req: any, options?: any) {
    super.authenticate(req, {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
      signOptions: {
        expiresIn: `${process.env.JWT_TOKEN_EXPIRE_SECONDS}s`,
      },
    });
  }

  async validate(payload: any): Promise<any> {
    const { user } = payload;

    const { address } = user;

    return {
      publicKey: address,
    };
  }
}
