import path from 'path';
import winston from 'winston';
import { Writable } from 'stream';
import {
  StreamTransportInstance,
} from 'winston/lib/winston/transports';
import { env } from '../env';
// eslint-disable-next-line import/no-cycle
import { formatLogError } from './format-log-error.helper';
import { LOG_LEVEL } from '../../shared/constants/log-level.constant';
import { Listener } from '../../shared/types/listener.type';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { LogDto } from '../../shared/types/log.dto.type';

const MAX_LOG_FILE_SIZE = 10000000; // 10MB

const CURRENT_LOG_LEVEL = env.IS_PRODUCTION ? LOG_LEVEL.INFO : LOG_LEVEL.SILLY;

const { combine, timestamp, splat, colorize, printf } = winston.format;

export const pgLogEvent = new TypedEventEmitter<{ logged: { logDto: LogDto } }>();

// if used before it's initialised, will likely throw "cannot find 'x' on undefined"
// eslint-disable-next-line import/no-mutable-exports
export let logger: Logger;

/**
 * @description
 * Formats a string for output into the console
 */
const consoleFormatter = printf((info) => {
  let context = '';
  if (info.context) {
    context = `[${info.context}] `;
  }

  // Error log
  if (info.meta && info.meta instanceof Error) {
    // eslint-disable-next-line max-len
    return `\n${info.timestamp} ${context}${info.level}: ${info.meta.name}\n============================================================\n${info.message}\n${info.meta.message}\n${info.meta.stack}\n============================================================`;
  }

  // Other log types with a meta object
  if (info.meta) {
    return `${info.timestamp} ${context}${info.level}: ${info.message}\n${JSON.stringify(info.meta, null, 2)}`;
  }

  // Message only logs
  return `${info.timestamp} ${context}${info.level}: ${info.message}`;
});

/**
 * A local replacement for console.log
 */
class Logger {
  /**
   * Transport that may be listened to for "logged" events
   */
  streamTransport: StreamTransportInstance & { on: (evt: 'logged', listener: Listener<LogDto>) => void };

  private _winston: winston.Logger;


  /**
   * @constructor
   */
  constructor() {
    const consoleTimestampFormat = 'HH:mm:ss.SSS';

    // Create a transport for streaming to the socket for client debugging
    const streamTransport = new winston
      .transports
      .Stream({
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stream: new Writable({ write(...args) {} }),
        format: timestamp(),
        level: CURRENT_LOG_LEVEL,
      });
    this.streamTransport = streamTransport;

    // Create a transport for logging to the console for server debugging
    const consoleTransport = new winston
      .transports
      .Console({
        format: combine(colorize(), timestamp({ format: consoleTimestampFormat }), splat(), consoleFormatter),
        level: CURRENT_LOG_LEVEL,
      });

    // Create a transport for logging to a file
    const fileTransport = new winston
      .transports
      .File({
        filename: path.resolve(env.LOG_PATH, `tpbot.log`),
        maxsize: MAX_LOG_FILE_SIZE,
        level: CURRENT_LOG_LEVEL,
      });

    // Create the winston instance
    this._winston = winston.createLogger({
      // format: combine(timestamp({ format: timestampFormat }), splat()),
      transports: [
        consoleTransport,
        streamTransport,
        fileTransport,
      ],
    });

    this._winston.on('error', this.handleError.bind(this));
  }


  /**
   * @description
   * Handle an error in winston
   *
   * @param err
   */
  // eslint-disable-next-line class-methods-use-this
  private handleError(err: Error) {
    console.error(`!!!WARNING!!! - WINSTON ERROR - UNABLE TO LOG TO TRANSPORTS - ${err}`, err);
  }


  /** * @description * Write an standard log * @param message * @param context * @param meta */
  log(message: string, context: string, meta: any) {
    this._winston.log({
      level: LOG_LEVEL.INFO,
      context,
      message,
      meta,
    });
  }


  /** * @description * Write an error message log * @param message * @param context * @param error */
  error(message: string, context: string, error: any) {
    this._winston.log({
      level: LOG_LEVEL.ERROR,
      context,
      message,
      meta: formatLogError(error),
    });
  }


  /** * @description * Write a warning message log * @param message * @param context * @param error */
  warn(message: string, context: string, meta: any) {
    this._winston.log({
      level: LOG_LEVEL.WARN,
      context,
      message,
      meta,
    });
  }


  /** * @description * Write an info message log * @param message * @param context * @param meta */
  info(message: string, context: string, meta: any) {
    this._winston.log({
      level: LOG_LEVEL.INFO,
      context,
      message,
      meta,
    });
  }


  /** * @description * Write a debug message log * @param message * @param context * @param meta */
  debug(message: string, context: string, meta: any) {
    this._winston.log({
      level: LOG_LEVEL.DEBUG,
      context,
      message,
      meta,
    });
  }


  /** * @description * Write a silly message log * @param message * @param context * @param meta */
  silly(message: string, context: string, meta: any) {
    this._winston.log({
      level: LOG_LEVEL.SILLY,
      context,
      message,
      meta,
    });
  }
}

/**
 * @description
 * Must be run before logger. can be used
 */
export function initLogger() {
  logger = new Logger();
}
