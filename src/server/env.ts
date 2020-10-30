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

  I2C_BUS_NO: envNum('I2C_BUS_NO'),
  I2C_ADDRESS_PCA9685: envNum('I2C_ADDRESS_PCA9685'),
  I2C_ADDRESS_INA219: envNum('I2C_ADDRESS_INA219'),

  INA219_POLL_INTERVAL: envNum('INA219_POLL_INTERVAL'),
  INA219_SAMPLES: envNum('INA219_SAMPLES'),

  MOTOR_PWM_FREQUENCY: envNum('MOTOR_PWM_FREQUENCY'),
  MOTOR_FR_PWM_CHANNEL: envNum('MOTOR_FR_PWM_CHANNEL'),
  MOTOR_FL_PWM_CHANNEL: envNum('MOTOR_FL_PWM_CHANNEL'),
  MOTOR_RR_PWM_CHANNEL: envNum('MOTOR_RR_PWM_CHANNEL'),
  MOTOR_RL_PWM_CHANNEL: envNum('MOTOR_RL_PWM_CHANNEL'),

  SERVO_PWM_FREQUENCY: envNum('SERVO_PWM_FREQUENCY'),
  SERVO_PAN_PWM_CHANNEL: envNum('SERVO_PAN_PWM_CHANNEL'),
  SERVO_TILT_PWM_CHANNEL: envNum('SERVO_TILT_PWM_CHANNEL'),
  SERVO_LOCK_PWM_CHANNEL: envNum('SERVO_LOCK_PWM_CHANNEL'),

  MOTOR_FR_DIR_PIN_FORWARD: envNum('MOTOR_FR_DIR_PIN_FORWARD'),
  MOTOR_FR_DIR_PIN_REVERSE: envNum('MOTOR_FR_DIR_PIN_REVERSE'),
  MOTOR_FL_DIR_PIN_FORWARD: envNum('MOTOR_FL_DIR_PIN_FORWARD'),
  MOTOR_FL_DIR_PIN_REVERSE: envNum('MOTOR_FL_DIR_PIN_REVERSE'),
  MOTOR_RR_DIR_PIN_FORWARD: envNum('MOTOR_RR_DIR_PIN_FORWARD'),
  MOTOR_RR_DIR_PIN_REVERSE: envNum('MOTOR_RR_DIR_PIN_REVERSE'),
  MOTOR_RL_DIR_PIN_FORWARD: envNum('MOTOR_RL_DIR_PIN_FORWARD'),
  MOTOR_RL_DIR_PIN_REVERSE: envNum('MOTOR_RL_DIR_PIN_REVERSE'),

  SERVO_PAN_MIN_PWM: envNum('SERVO_PAN_MIN_PWM'),
  SERVO_PAN_ZERO_PWM: envNum('SERVO_PAN_ZERO_PWM'),
  SERVO_PAN_MAX_PWM: envNum('SERVO_PAN_MAX_PWM'),
  SERVO_TILT_MIN_PWM: envNum('SERVO_TILT_MIN_PWM'),
  SERVO_TILT_ZERO_PWM: envNum('SERVO_TILT_ZERO_PWM'),
  SERVO_TILT_MAX_PWM: envNum('SERVO_TILT_MAX_PWM'),
  SERVO_LOCK_MIN_PWM: envNum('SERVO_LOCK_MIN_PWM'),
  SERVO_LOCK_ZERO_PWM: envNum('SERVO_LOCK_ZERO_PWM'),
  SERVO_LOCK_MAX_PWM: envNum('SERVO_LOCK_MAX_PWM'),

  LED_PIN: envNum('LED_PIN'),
  LED_DEFAULT_BRIGHTNESS: envNum('LED_DEFAULT_BRIGHTNESS'),
  LED_COUNT_FRONT: envNum('LED_COUNT_FRONT'),
  LED_COUNT_RIGHT: envNum('LED_COUNT_RIGHT'),
  LED_COUNT_REAR: envNum('LED_COUNT_REAR'),
  LED_COUNT_LEFT: envNum('LED_COUNT_LEFT'),
  LED_MAP: envString('LED_MAP'),
} as const;

export type env = typeof env;
