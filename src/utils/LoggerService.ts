import { LoggerService as LS } from '@nestjs/common';
import * as winston from 'winston';
const { combine, timestamp, printf } = winston.format;
import * as Transport from 'winston-transport';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';

export class LoggerService implements LS {
  private logger: LS;

  constructor() {
    this.logger = WinstonModule.createLogger({
      transports: this.logTransports(),
    });
  }

  log(message: any, fields?: any) {
    this.logger.log(this.toPrettyJson(message, fields));
  }
  error(message: any, fields?: any) {
    this.logger.error(this.toPrettyJson(message, fields));
  }
  warn(message: any, fields?: any) {
    this.logger.warn(this.toPrettyJson(message, fields));
  }
  debug(message: any, fields?: any) {
    this.logger.debug(this.toPrettyJson(message, fields));
  }
  verbose(message: any, fields?: any) {
    this.logger.verbose(this.toPrettyJson(message, fields));
  }

  private toPrettyJson(message: any, fields?: any) {
    let log = {};
    if (typeof message === 'string') {
      log['message'] = message;
    } else if (typeof message === 'object') {
      for (const [key, value] of Object.entries(message)) {
        log[key] = value;
      }
    }
    if (fields) {
      if (typeof fields === 'object') {
        for (const [key, value] of Object.entries(fields)) {
          log[key] = value;
        }
      } else if (typeof fields === 'string') {
        log['context'] = fields;
      }
    }
    return log;
  }

  private logTransports = () => {
    const logFile = process.env.LOG_FILE ?? false;
    const logLevel = !!process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'error';

    const format = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), nestWinstonModuleUtilities.format.nestLike());

    const logTransports: Transport[] = [
      new winston.transports.Console({
        format: format,
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
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            printf((info) => `[${info.timestamp}] ${info.level}: ${info.message} ${JSON.stringify(info)}`),
          ),
        }),
      );
    }

    return logTransports;
  };
}
