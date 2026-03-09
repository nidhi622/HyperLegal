export default function env(key: string, defaultValue?: any) {
  const normalizedKey = key.toUpperCase();
  const value = process.env[normalizedKey];

  return value === undefined || value === '' ? defaultValue : value;
}
