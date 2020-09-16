declare const __VERSION__: string;
declare const __CLIENT_KEY__: string;

export const global = {
  VERSION: __VERSION__,
  
  // @deprecated: Need to introduce proper auth
  CLIENT_KEY: __CLIENT_KEY__,
};
