export class DateUtils {
  static getTimestamp(date: Date): number {
    return new Date(date).getTime() / 1000;
  }
}
