const path = require('path');
const intervalFileRead = require('./lib/intervalFileRead.js');

const RETEMP = /t=([-0-9]+)$/;
const RECRC = /YES$/;

function check (opts) {
	if (opts.input.length !== 0) throw new Error('No inputs can be specified');
	if (opts.output.length !== 1) throw new Error('One output must be specified');
	if (typeof opts.sensorSerial !== 'string') throw new Error('sensorSerial must be specified');
	if (typeof opts.interval !== 'number') throw new Error('interval must be specified');
	if (typeof opts.retries !== 'number') opts.retries = 3;
}

function factory (opts, input, output) {
	const filePath = path.join('/sys/bus/w1/devices', opts.sensorSerial, 'w1_slave');
	return intervalFileRead({
		...opts,
		filePath,
		processData: (data) => {
			const [lineCrc, lineTemp] = data.split('\n');

			// Make sure CRC is valid
			if (!RECRC.test(lineCrc)) {
				return Promise.reject(new Error('Invalid CRC'));
			}

			// Read temperature
			const reTemp = RETEMP.exec(lineTemp);
			if (!reTemp) {
				return Promise.reject(new Error('Parsing error'));
			}
			output[0].value = parseInt(reTemp[1]) / 1000;
		}
	});
}

module.exports = {check, factory};
