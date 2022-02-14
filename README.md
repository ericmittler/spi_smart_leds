# SPI Smart LEDs
A javascript library to use the LED strips like the Adafruit DotStar LED strip with Raspberry Pi. 

This is copied from https://github.com/mattmazzola/dotstar

DotStar LEDs: https://learn.adafruit.com/adafruit-dotstar-leds/overview

Based on: https://github.com/RussTheAerialist/node-adafruit-pixel

Added support for HD108 16bit color LEDs, as an experiment for use at [Game On Berkeley](https://www.gameonberkeley.com). We'll consider a pull request or other proper publish after we are satisfied with the efficacy of APA102 and HD108 LEDs (Dotstar variants). For now, this is an experiment that you are welcome to watch and contribute to.

Because we use both APA102 and HD108 lights, and because APA102 is 8 bit color and HD108 is 16 bit color, we wanted to create this one library to manage both. Since we liked mattmazzola's simple implementation, we're building on that (which build's on the shoulders of others listed below). Thanks to [Matt](https://github.com/mattmazzola).

We're just hacking (not test driving) here and being lazy have not updated the Jasmine. 
There likely will be bugs until the unit tests are done. Use at your own risk.

## No dependencies

This library is not tied to specific implementaiton of Spi bus communication and allows taking any object which implements the `dotstar.ISpy` interface:
```
export interface ISpi {
  write(buffer: Buffer, callback: (error: any, data: any) => void): void;
}
```

This means you can use node [pi-spy](https://github.com/natevw/pi-spi) or [node-spi](https://github.com/RussTheAerialist/node-spi)

## Usage

```
import SmartLEDs from 'spi_smart_leds'
const SPI = require('pi-spi')

spi = SPI.initialize('/dev/spidev0.0')
const ledStripLength = 144;

const ledStrip = new SmartLEDs.SPISmartLEDs(spi, {
  length: ledStripLength, isHD108: true
})
```

> When an instace of Dotstar class is created it will automatically set all LEDs to off/black.

## Methods

Set all leds to same color
```
ledStrip.all(255, 200, 175, 0.8)
ledStrip.sync()
```

Set single led to a color
```
ledStrip.set(1, 0, 255, 148, 0.5)
ledStrip.sync()
```

> For both the `all` and `set` methods if you don't specify the `a` (alpha) value it defaults to 1.


Set all leds to off/black
```
ledStrip.clear()
ledStrip.sync()
```

Set all leds to off/black without overwriting internal LED color data.
```
ledStrip.off()
```

# Notes
The DotStar library is simple. It simply manages node 3 different node Buffers.

There is the `colorBuffer` which holds color data for each LED.  From the design sheet you can see that each LED is 4 bytes and must start with first three bits as ones (0b11100000)

There is the `ledBuffer` which is full buffere which overlaps with the `colorBuffer` but has the prefix of 4 bytes of 0x00 and suffix of 4 bytes of 0xFF.

There is also another buffer called `offBuffer` which is like the full `ledBuffer` but preconfigured to set all LEDs off and can be written over the spi bus without having to update the color buffer.

This means you could alternate between off and red without updating anything in memory. Notice the calls to sync send whatever the current state of the `ledBuffer`.

```
ledStrip.all(255,0,0);
ledStrip.sync(); // Set red
ledStrip.off();  // Set off
ledStrip.sync(); // Set red
ledStrip.off();  // Set off
...
```
