# Footurama Package: Sensors

This is the package you want to use for reading sensors.

### ftrm-sensors/w1therm

Read temperature sensors from the Dallas 1-wire bus using the w1 driver inside the Linux kernel.

Configuration:

 * ```input```: **0**.
 * ```output```: **1**. Target pipe for measured temperatures in degree Celsius.
 * ```sensorSerial```: The serial of the sensor to read from. Cf. ```ls /sys/bus/w1/devices``` to get a list of detected sensor serials.
 * ```interval```: Interval between two readings in milliseconds.
 * ```retries```: The number of retries if reading failed. (e.g. invalid CRC) Default: 3.

Example:

```js
// Inject random numbers every second
module.exports = [require('ftrm-sensors/w1therm'), {
	output: 'output-pipe-with-temperature',
	sensorSerial: '10-000802bf5587',
	interval: 30000 // Every 30s
}];
```

### ftrm-sensors/iio

Read sensors using the Linux IIO driver.

Configuration:

 * ```input```: **0**.
 * ```output```: **1**. Target pipe for measured values.
 * ```device```: The IIO device to read from. Cf. ```ls /sys/bus/iio/devices``` to get a list of detected devices.
 * ```channel```: The channel to read from. Cf. ```ls /sys/bus/iio/devices/iio:device?/in_*``` to get a list of available channels.
 * ```interval```: Interval between two readings in milliseconds.
 * ```retries```: The number of retries if reading failed. (e.g. invalid CRC) Default: 3.
 * ```convert```: A function that converts read data to values: ```(data) => value```. If the given channel type is known, a default convert function is used.

Known channel types:

 * ```'in_temp_input'```: Will output temperature in degree Celsius.
 * ```'in_humidityrelative_input'```: Will output relative humidity in percent.


Example:

```js
// Inject random numbers every second
module.exports = [require('ftrm-sensors/iio'), {
	output: 'output-pipe-with-temperature',
	device: 'iio:device0',
	channel: 'in_temp_input'
	interval: 30000 // Every 30s
}];
```
