declare module 'rpi-ws281x-native' {
  import { EventEmitter } from 'events';

  interface ws281x extends EventEmitter {
    init: (numLeds: number, options: any) => void;

    setIndexMapping: (mapping: number[]) => void;

    render: (data: Uint32Array) => Uint32Array;

    setBrightness: (brightness: number) => void;

    reset: () => void;

    isStub: () => boolean;
  }

  export default ws281x;
}
