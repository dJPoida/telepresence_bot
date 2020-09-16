/**
 * @description
 * Format an error for logging
 *
 * @param error
 */
export function formatLogError(error: any): any {
  if (error instanceof Error) {
    return {
      ...error,
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n'),
    };
  } if (typeof error === 'object' && error !== null) {
    return error;
  }
  return error;
}
