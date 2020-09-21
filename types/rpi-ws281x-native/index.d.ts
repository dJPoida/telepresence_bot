declare module 'rpi-ws281x-native' {
  import { EventEmitter } from 'events';

  export interface Ws281x extends EventEmitter {
    init: (numLeds: number, options: any) => void;

    setIndexMapping: (mapping: number[]) => void;

    render: (data: Uint32Array) => Uint32Array;

    setBrightness: (brightness: number) => void;

    reset: () => void;

    isStub: () => boolean;
  }

  const ws281x: Ws281x;

  export default ws281x;
}
