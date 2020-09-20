import { EventEmitter } from 'events';
import ws281x from 'rpi-ws281x-native';

export class LEDStrip {
  private device: EventEmitter = ws281x;

  /**
   * @constructor
   *
   * @param {Kernel} kernel
   */
  constructor() {
    this.bindEvents();
  }

  /**
   * Bind the event listeners this class cares about
   */
  bindEvents(): void {}
}
