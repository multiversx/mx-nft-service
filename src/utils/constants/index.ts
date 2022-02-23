export const redisURL = `redis://root:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}:${process.env.REDIS_PORT}`;

export const TimeConstants = {
  oneMinute: 60,
  oneHour: 3600,
  oneDay: 86400,
  oneWeek: 604800,
};
