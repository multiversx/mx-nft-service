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
} = winston.format;
import * as Transport from 'winston-transport';

export const logTransports = () => {
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

  return logTransports;
};
