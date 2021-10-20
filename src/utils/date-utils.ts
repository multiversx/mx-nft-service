export class DateUtils {
  static getTimestamp(date: Date): number {
    return new Date(date).getTime() / 1000;
  }

  static getCurrentTimestamp(): number {
    return new Date(new Date().toUTCString()).getTime() / 1000;
  }
}
