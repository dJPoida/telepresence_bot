import { ContextLogger } from './context-logger.helper';

/**
 * @description
 * logger for a class
 *
 * @param classToLog
 */
export function classLoggerFactory(classToLog: { constructor: { name: string }}): ContextLogger {
  const { constructor: { name } } = classToLog;
  return new ContextLogger(name);
}
