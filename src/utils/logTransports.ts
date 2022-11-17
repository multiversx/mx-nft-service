import * as winston from 'winston';
const {
  combine,
  timestamp,
  json,
  colorize,
  align,
  printf,
  splat,
  simple,
  prettyPrint,
} = winston.format;
import * as Transport from 'winston-transport';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

export const logTransports = () => {
  const logFile = process.env.LOG_FILE ?? false;
  const logLevel = !!process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'error';

  const logTransports: Transport[] = [
    new winston.transports.Console({
      format: combine(
        //colorize({ all: true }),
        //nestWinstonModuleUtilities.format.nestLike(),
        timestamp({ format: 'DD-MM-YY HH:mm:ss' }),
        //json(),
        prettyPrint({ colorize: true }),
        //align(),
        //simple(),
        //splat(),
        // printf(
        //   (info) =>
        //     `[${info.timestamp}] ${info.level}: ${info.message} ${
        //       typeof info.context === 'object'
        //         ? ' - ' + JSON.stringify(info.context)
        //         : ''
        //     }`,
        // ),
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

  return logTransports;
};
