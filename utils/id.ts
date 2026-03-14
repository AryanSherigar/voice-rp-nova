export const generateId = (prefix?: string): string => {
  const normalizedPrefix = prefix ? `${prefix.replace(/_+$/, '')}_` : '';
  return `${normalizedPrefix}${crypto.randomUUID()}`;
};
