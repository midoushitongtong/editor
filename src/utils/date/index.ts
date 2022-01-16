export const timestampToString = (timestamp: number) => {
  const date = new Date(timestamp);

  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padEnd(2, '0')}-${date
    .getDate()
    .toString()
    .padEnd(2, '0')} ${date.getHours().toString().padEnd(2, '0')}:${date
    .getMinutes()
    .toString()
    .padEnd(2, '0')}:${date.getSeconds().toString().padEnd(2, '0')}`;
};
