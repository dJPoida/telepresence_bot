# telepresence_bot
A NodeJS driver for a simple home-brew Raspberry Pi telepresence robot.

## Known issues
- When running on a Raspberry Pi 4, the `rpi-ws281x-native` library `v0.10.0` does not recognise the hardware and instead returns a stub. Until an updated version of the library is released, the following code needs to be added to `node_modules/rpi-ws281x-native/lib/ws281x-native.js` at line 47:
  ```
  case 'bcm2711': return 1;
  ```