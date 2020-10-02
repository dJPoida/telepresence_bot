import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

function envBool(name: string) {
  const input = process.env[name];
  if (input === 'true') return true;
  if (input === 'false') return false;
  throw new TypeError(`Unable to parse env variable "${name}" as boolean`);
}

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
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  LOG_PATH: resolve('../../', envString('LOG_PATH')),
  USE_WEBPACK: envBool('USE_WEBPACK'),
  DEFAULT_PORT: envNum('DEFAULT_PORT'),
  SOURCE_PATH: resolve(__dirname, '../../src'),
  DIST_PATH: resolve(__dirname, '../../dist'),
  CLIENT_KEY: envString('CLIENT_KEY'),
  DEFAULT_SPEED: envNum('DEFAULT_SPEED'),
  PING_INTERVAL: envNum('PING_INTERVAL'),
} as const;

export type env = typeof env;
