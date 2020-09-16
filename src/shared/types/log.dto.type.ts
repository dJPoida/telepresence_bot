import { A_LOG_LEVEL } from "../constants/log-level.constant";

export interface LogDto {
  readonly timestamp: Date;
  readonly level: A_LOG_LEVEL;
  readonly context: null | string;
  readonly message: string;
  readonly meta: null | object;
}
