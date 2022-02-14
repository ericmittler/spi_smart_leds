"use strict";
var SPISmartLEDs = (function () {
    function SPISmartLEDs(spi, options) {
        if (options === void 0) { options = {} }
        this.length = options.length || SPISmartLEDs.defaultOptions.length
        this.isHD108 = options.isHD108 || SPISmartLEDs.defaultOptions.isHD108
        // this.bytesLength = this.isHD108 ? 8 : 4
        this.startBytesLength = this.isHD108 ? 8 : 4
        this.endBytesLength = this.isHD108 ? 8 : 4
        this.bytesPerLed = this.isHD108 ? 8 : 4
        var fullBufferLength = this.startBytesLength + this.length * this.bytesPerLed + this.endBytesLength
        this.ledBuffer = new Buffer(fullBufferLength)
        this.ledBuffer.fill(0)
        this.ledBuffer.fill(255, this.ledBuffer.length - this.endBytesLength)
        // Create buffer which is subset of the full buffer represetenting only the LEDs
        this.colorBuffer = this.ledBuffer.slice(this.startBytesLength, -this.endBytesLength)
        this.clear();
        this.offBuffer = new Buffer(fullBufferLength)
        this.ledBuffer.copy(this.offBuffer)
        this.device = spi
        this.write(this.offBuffer)
    }

    SPISmartLEDs.prototype.all = function (r, g, b, a) {
        if (a === void 0) { a = 1; }
        var singleLedBuffer = this.convertRgbaToLedBuffer(r, g, b, a);
        for (var led = 0; led < this.length; led++) {
            singleLedBuffer.copy(this.colorBuffer, this.bytesPerLed * led);
        }
    }

    SPISmartLEDs.prototype.clear = function () {
        this.all(0, 0, 0, 0);
    }

    //Turn off every LED without having to update the color buffer.
    SPISmartLEDs.prototype.off = function () {
        this.write(this.offBuffer);
    }

    SPISmartLEDs.prototype.set = function (led, r, g, b, a) {
        if (a === void 0) { a = 1; }
        if (led < 0) {
            throw new Error("led value must be a positive integer. You passed " + led);
        }
        if (led > this.length) {
            throw new Error("led value must not be greater than the maximum length of the led strip. The max length is: " + this.length + ". You passed: " + led);
        }
        var ledBuffer = this.convertRgbaToLedBuffer(r, g, b, a);
        var ledOffset = this.bytesPerLed * led;
        ledBuffer.copy(this.colorBuffer, ledOffset);
    }

    SPISmartLEDs.prototype.sync = function () {
        this.write(this.ledBuffer)
    }

    SPISmartLEDs.prototype.convertRgbaToLedBuffer = function (r, g, b, a) {
        if (a === void 0) { a = 1 }
        const ledBuffer = new Buffer(this.bytesPerLed)
        if (this.isHD108) {
            const brightnessValue = 32768 + (Math.floor(31 * a) * 1057)
            ledBuffer.writeUInt16BE(brightnessValue, 0)
            ledBuffer.writeUInt16BE(r * 256, 2)
            ledBuffer.writeUInt16BE(g * 256, 4)
            ledBuffer.writeUInt16BE(b * 256, 6)
        } else {
            const brightnessValue = Math.floor(31 * a) + 224
            ledBuffer.writeUInt8(brightnessValue, 0)
            ledBuffer.writeUInt8(b, 1)
            ledBuffer.writeUInt8(g, 2)
            ledBuffer.writeUInt8(r, 3)
        }
        return ledBuffer
    };

    SPISmartLEDs.prototype.write = function (buffer) {
        this.device.write(buffer, function (error, r) {
            if (error) {
                throw error
            }
        })
    }

    SPISmartLEDs.defaultOptions = {
        length: 10,
        isHD108: false
    }

    return SPISmartLEDs
}())

exports.SPISmartLEDs = SPISmartLEDs