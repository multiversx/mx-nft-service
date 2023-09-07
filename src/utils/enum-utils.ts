/**
 * Enum helpers
 */
export class EnumUtils {
  /**
   * Returns the enum keys
   * @param enumObj enum object
   * @param enumType the enum type
   */
  static getEnumKeys(enumObj: any, enumType: EnumType): any[] {
    return EnumUtils.getEnumValues(enumObj, enumType).map((value) => enumObj[value]);
  }

  /**
   * Returns the enum values
   * @param enumObj enum object
   * @param enumType the enum type
   */
  static getEnumValues(enumObj: any, enumType: EnumType): any[] {
    return Object.keys(enumObj).filter((key) => typeof enumObj[key] === enumType);
  }
}

/**
 * Supported enum types.
 */
export enum EnumType {
  Number = 'number',
  String = 'string',
}
