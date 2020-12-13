declare const __VERSION__: string;
declare const __CLIENT_KEY__: string;
declare const __WEB_RTC_PORT__: number;

export const global = {
  VERSION: __VERSION__,
  WEB_RTC_PORT: __WEB_RTC_PORT__,

  // @deprecated: Need to introduce proper auth
  CLIENT_KEY: __CLIENT_KEY__,
};
