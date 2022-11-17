import { LoggerService as LS } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { Logger } from 'winston';
const {
  combine,
  timestamp,
  json,
  colorize,
  align,
  printf,
  prettyPrint,
  cli,
  splat,
  simple,
} = winston.format;
import * as Transport from 'winston-transport';

export class LoggerService implements LS {
  private logger;

  constructor() {
    const logLevel = !!process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'error';
    const logFile = process.env.LOG_FILE ?? false;

    const logTransports: Transport[] = [
      new winston.transports.Console({
        format: combine(
          colorize({ all: true }),
          align(),
          timestamp({ format: 'DD-MM-YY HH:mm:ss' }),
          simple(),
          splat(),
          printf(
            (info) =>
              `[${info.timestamp}] ${info.level}: ${info.message} ${
                typeof info.context === 'object'
                  ? ' - ' + JSON.stringify(info.context)
                  : ''
              }`,
          ),
        ),
      }),
    ];

    if (logFile) {
      logTransports.push(
        new winston.transports.File({
          filename: logFile,
          dirname: 'logs',
          maxsize: 100000,
          level: logLevel,
          format: combine(
            align(),
            timestamp(),
            json(),
            printf(
              (info) =>
                `[${info.timestamp}] ${info.level}: ${
                  info.message
                } ${JSON.stringify(info.context)}`,
            ),
          ),
        }),
      );
    }

    this.logger = WinstonModule.createLogger({
      transports: logTransports,
      format: combine(
        colorize({ all: true }),
        align(),
        timestamp({ format: 'DD-MM-YY HH:mm:ss' }),
        simple(),
        splat(),
        printf(
          (info) =>
            `[${info.timestamp}] ${info.level}: ${info.message} ${
              typeof info.context === 'object'
                ? ' - ' + JSON.stringify(info.context)
                : ''
            }`,
        ),
      ),
    });

    console.log = (message: any, params?: any) => {
      this.logger.debug(message, params);
    };
  }

  info(message: string, context?: any) {
    this.logger.info(message, context);
  }
  log(message: string, context?: any) {
    this.logger.log(message, context);
  }
  error(message: string, context?: any) {
    this.logger.error(message, context);
  }
  warn(message: string, context?: any) {
    this.logger.warning(message, context);
  }
  debug(message: string, context?: any) {
    this.logger.debug(message, context);
  }
  verbose(message: string, context?: any) {
    this.logger.verbose(message, context);
  }
}
