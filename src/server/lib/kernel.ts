import { EventEmitter } from 'events';
import { Express } from 'express';
import http from 'http';
import { KERNEL_EVENT } from '../const/kernel_event.const';
import { applyExpressMiddleware } from '../http/apply-express-middleware';
import { env } from '../env';

export class Kernel extends EventEmitter {
  
  private _expressApp: Express;
  
  private _httpServer: http.Server;
  
  private _initialised: boolean;
  
  
  /**
  * @constructor
  */
  constructor(expressApp: Express, httpServer: http.Server) {
    super();
    
    this._expressApp = expressApp;
    this._httpServer = httpServer;
    this._initialised = false;
    
    this._bindEvents();
    
    this.initialise();
  }
  
  get expressApp():Express { return this._expressApp; }
  
  get httpServer() { return this._httpServer; }

  get initialised() { return this._initialised; }

  
  /**
  * Initialise the kernel
  */
  async initialise() {
    console.log('\nKernel initialising...');

    // TODO: Initializing stuff

    this._initialised = true;
    this.emit(KERNEL_EVENT.INITIALISED);
  }
  
  
  /**
   * Run the application
   */
  async run() {
    console.log('Kernel Running...');

    // Apply the routing and middleware to the express app
    applyExpressMiddleware(this.expressApp);

    // Server running
    console.log('Server Running...');
    this.httpServer.listen(env.DEFAULT_PORT, () => console.info(`Http server running on port ${env.DEFAULT_PORT}`));
  }


  /**
   * Bind the event listeners this class cares about
   */
  _bindEvents() {
    this.once(KERNEL_EVENT.INITIALISED, this._handleInitialised.bind(this));
  }


  /**
   * Fired once after the kernel has initialised
   */
  _handleInitialised() {
    console.log('Kernel Initialised.\n');
    this.run();
  } 
}