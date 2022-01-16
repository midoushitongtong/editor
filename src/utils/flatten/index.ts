export const flattenArrById = (arr: any[]) => {
  return arr.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});
};

export const objectToArray = (obj: any) => {
  return Object.keys(obj).map((key) => obj[key]);
};
