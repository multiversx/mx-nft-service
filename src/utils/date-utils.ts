export class DateUtils {
  static getTimestamp(date: Date): number {
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

  static timestampToIsoStringWithoutTime(timestamp: number): string {
    let d = new Date(timestamp * 1000);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  static isIsoToday(isoDate: string): boolean {
    if (new Date(isoDate).getDate() === new Date().getDate()) {
      return true;
    }
  }
}
