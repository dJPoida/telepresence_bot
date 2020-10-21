// var i2cBus = require("i2c-bus");
// var Pca9685Driver = require("pca9685").Pca9685Driver;

// var pwm = null;

// var options = {
//     i2c: i2cBus.openSync(1),
//     address: 0x40,
//     frequency: 50,
//     debug: false
// };

// const run = async () => {
//     let position = 800;
//     let direction = 1;

//     setInterval(() => {
//         position += direction;
//         if (position >= 2200) {
//             direction = -1;
//         } else if (position <= 800) {
//             direction = 1;
//         }
//         pwm.setPulseLength(0, position);
//     }, 1);
// }

// pwm = new Pca9685Driver(options, function(err) {
//     if (err) {
//         console.error("Error initializing PCA9685", err);
//         process.exit(-1);
//     }
//     console.log("Initialization done");

//     run();

//     /*
//     // Set channel 0 to turn on on step 42 and off on step 255
//     // (with optional callback)
//     pwm.setPulseRange(0, 42, 255, function() {
//         if (err) {
//             console.error("Error setting pulse range.");
//         } else {
//             console.log("Pulse range set.");
//         }
//     });

//     // Set the pulse length to 1500 microseconds for channel 2
//     pwm.setPulseLength(2, 1500);

//     // Set the duty cycle to 25% for channel 8
//     pwm.setDutyCycle(8, 0.25);

//     // Turn off all power to channel 6
//     // (with optional callback)
//     pwm.channelOff(6, function() {
//         if (err) {
//             console.error("Error turning off channel.");
//         } else {
//             console.log("Channel 6 is off.");
//         }
//     });

//     // Turn on channel 3 (100% power)
//     pwm.channelOn(3);
//     */
// });
