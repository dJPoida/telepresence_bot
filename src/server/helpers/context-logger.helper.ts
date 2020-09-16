// eslint-disable-next-line import/no-cycle
import { logger } from './logger.helper';

export class ContextLogger {
  constructor(private context: string) {}

  getContext(): Readonly<string> { return this.context; }

  /**
   * @description
   * Write a standard log
   * @param message
   * @param meta
   * @param contextMeta
   */
  log(message: string, meta?: any) {
    logger.log(message, this.context, meta);
  }

  /**
   * @description
   * Write an error message log
   * @param message
   * @param error
   * @param contextMeta
   */
  error(message: string, error?: any) {
    logger.error(message, this.context, error);
  }

  /**
   * @description
   * Write a warning message log
   * @param message
   * @param meta
   * @param contextMeta
   */
  warn(message: string, meta?: any) {
    logger.warn(message, this.context, meta);
  }

  /**
   * @description
   * Write an info message log
   * @param message
   * @param meta
   * @param contextMeta
   */
  info(message: string, meta?: any) {
    logger.info(message, this.context, meta);
  }

  /**
   * @description
   * Write a debug message log
   * @param message
   * @param meta
   * @param contextMeta
   */
  debug(message: string, meta?: any) {
    logger.debug(message, this.context, meta);
  }

  /**
   * @description
   * Write a silly message log
   * @param message
   * @param meta
   * @param contextMeta
   */
  silly(message: string, meta?: any) {
    logger.silly(message, this.context, meta);
  }
}
