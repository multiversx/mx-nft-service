import { envload } from './config/env_load';
envload();
import * as bodyParser from 'body-parser';
import * as errorHandler from 'errorhandler';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

/**
 * Wrapper for Express server
 */
export class Express {
  /**
   * Express instance
   */
  private app;
  /**
   * Server instance
   */
  private server;

  /**
   * Init express server
   */
  async init() {
    const app = (this.app = await NestFactory.create<NestExpressApplication>(
      AppModule,
    ));

    app.disable('x-powered-by');
    app.enable('trust-proxy');

    const corsOrigin =
      process.env.CORS_ORIGINS.split(',').map((item) => new RegExp(item)) ?? [];

    app.enableCors({
      origin: corsOrigin,
    });

    if (process.env.NODE_ENV !== 'production') {
      const options = new DocumentBuilder()
        .setTitle('Elrond Delegation API')
        .setDescription('')
        .setVersion('1.0')
        .build();

      const document = SwaggerModule.createDocument(app, options);
      SwaggerModule.setup('api-docs', app, document);
    }

    // Configure ExpressJS
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    /*
     * Error Handler. Provides full stack - remove for production
     */
    app.use(errorHandler());

    /*
     * Protect the API of well-known web vulnerabilities
     */
    app.use(helmet());

    /*
     * Use global validation type
     */
    app.useGlobalPipes(new ValidationPipe());

    await app.startAllMicroservicesAsync();
  }

  /**
   * Return the express instance
   */
  getExpressApp() {
    return this.app;
  }

  /**
   * Start the express server
   * @param port
   */
  listen(port) {
    return new Promise((res) => {
      this.server = this.app.listen(port, res);
    });
  }
}
