# telepresence_bot
A NodeJS driver for a simple home-brew Raspberry Pi telepresence robot.


## Features

### Graceful Shutdown Button
A push or momentary button on `GPIO26` can be held for 1second to gracefully shutdown the Raspberry Pi before pulling the power. This is configured as a python script that runs on start-up in `/home/pi/piShutdown.py`. Thanks to @CoreElectronics for the handy script: [How to make a safe shutdown button for raspberry pi](https://core-electronics.com.au/tutorials/how-to-make-a-safe-shutdown-button-for-raspberry-pi.html).
**Note:** This may eventually be replaced by a shutdown listener inside the Node application.

## Known issues
- When running on a Raspberry Pi 4, the `rpi-ws281x-native` library `v0.10.0` does not recognise the hardware and instead returns a stub. Until an updated version of the library is released, the following code needs to be added to `node_modules/rpi-ws281x-native/lib/ws281x-native.js` at line 47:
  ```
  case 'bcm2711': return 1;
  ```
