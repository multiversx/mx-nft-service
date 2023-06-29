import * as moment from 'moment';

export class DateUtils {
  static getTimestamp(date: Date = new Date()): number {
    return new Date(date).getTime() / 1000;
  }

  static getCurrentTimestampPlusDays(days: number): number {
    let today = new Date();
    today.setDate(today.getDate() + days);
    return new Date(today.toUTCString()).getTime() / 1000;
  }

  static getCurrentTimestampPlus(hours: number): number {
    let today = new Date();
    today.setHours(today.getHours() + hours);
    return new Date(today.toUTCString()).getTime() / 1000;
  }

  static getCurrentTimestampPlusMinute(minutes: number): number {
    let today = new Date();
    today.setMinutes(today.getMinutes() + minutes);
    return new Date(today.toUTCString()).getTime() / 1000;
  }

  static getCurrentTimestampPlusYears(years: number): number {
    let today = new Date();
    today.setFullYear(today.getFullYear() + years);
    return new Date(today.toUTCString()).getTime() / 1000;
  }

  static getCurrentTimestamp(): number {
    return new Date(new Date().toUTCString()).getTime() / 1000;
  }

  static getDateFromTimestampWithoutTime(timestamp: number) {
    return new Date(timestamp * 1000).toJSON().slice(0, 10);
  }

  static getUtcDateFromTimestamp(timestamp: number): Date {
    return new Date(new Date(timestamp * 1000).toUTCString());
  }

  static getDatewithTimezoneInfo(timestamp: number): Date {
    const date = new Date(timestamp * 1000);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  }

  static timestampToIsoStringWithHour(timestamp: number): string {
    let date = new Date(timestamp * 1000);
    date.setUTCMinutes(0, 0, 0) / 1000;
    return moment.utc(date).format('yyyy-MM-DD HH:mm:ss');
  }

  static isTimestampToday(timestamp: number): boolean {
    var today = new Date().setHours(0, 0, 0, 0) / 1000;
    var thatDay = new Date(timestamp * 1000).setHours(0, 0, 0, 0) / 1000;
    if (today === thatDay) {
      return true;
    }
  }
}
