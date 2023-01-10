const SEPARATOR = '_';

export const generateCacheKeyFromParams = (...args: any[]): string => {
  let cacheKey = '';
  for (let arg of args) {
    if (isObject(arg)) {
      cacheKey += `${JSON.stringify(arg)}${SEPARATOR}`;
    } else {
      cacheKey += `${arg}${SEPARATOR}`;
    }
  }
  return cacheKey.slice(0, -1);
};

const isObject = (input) => {
  return input === Object(input);
};
