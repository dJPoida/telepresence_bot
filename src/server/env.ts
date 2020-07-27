import dotenv from 'dotenv';

dotenv.config();

function envNum(name: string) {
  const input = process.env[name];
  const num = Number(input);
  if (Number.isNaN(num) || !Number.isFinite(num)) throw new TypeError(`Unable to parse env variable "${name}" as number (got ${num})`);
  return num;
}

function envString(name: string) {
  const input = process.env[name];
  if (input === undefined) throw new TypeError(`Unable to parse env variable "${name}" as string`);
  return input;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export const env = {
  NODE_ENV: envString('NODE_ENV'),
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  PORT: envNum('PORT'),
} as const;

export type env = typeof env;
