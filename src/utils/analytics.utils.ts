import * as moment from 'moment';

export const decodeTime = (time: string): [string, moment.unitOfTime.Base] => {
  const [timeAmount, timeUnit] = time?.match(/[a-zA-Z]+|[0-9]+/g);
  return [timeAmount, timeUnit as moment.unitOfTime.Base];
};

export const computeTimeInterval = (time: string, start?: string): [Date, Date] => {
  const [timeAmount, timeUnit] = decodeTime(time);

  const startDate1 = moment().utc().subtract(timeAmount, timeUnit);

  const startDate2 = start ? moment.unix(parseInt(start)).utc() : undefined;

  const startDate = startDate2 ? moment.max(startDate1, startDate2).toDate() : startDate1?.toDate();
  const endDate = moment().utc().toDate();

  return [startDate, endDate];
};
