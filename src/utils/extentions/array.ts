declare global {
  interface Array<T> {
    groupBy(predicate: (item: T) => any): any;
  }
}

Array.prototype.groupBy = function (predicate: Function, asArray = false) {
  let result = this.reduce(function (rv, x) {
    (rv[predicate(x)] = rv[predicate(x)] || []).push(x);
    return rv;
  }, {});

  if (asArray === true) {
    result = Object.keys(result).map((key) => {
      return {
        key: key,
        values: result[key],
      };
    });
  }

  return result;
};

export {};
