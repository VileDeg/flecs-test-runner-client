export const mapRecord = <K extends string, V, R>(
  record: Record<K, V>,
  callback: (value: V, key: K) => R,
): Record<K, R> => {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      callback(value as V, key as K),
    ]),
  ) as Record<K, R>;
};
