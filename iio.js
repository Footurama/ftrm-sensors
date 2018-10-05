const path = require('path');
const intervalFileRead = require('./lib/intervalFileRead.js');

const convertFunctions = {
	'in_temp_input': (data) => parseInt(data) / 1000,
	'in_humidityrelative_input': (data) => parseInt(data) / 1000
};

function check (opts) {
	if (opts.input.length !== 0) throw new Error('No inputs can be specified');
	if (opts.output.length !== 1) throw new Error('One output must be specified');
	if (typeof opts.device !== 'string') throw new Error('device must be specified');
	if (typeof opts.channel !== 'string') throw new Error('channel must be specified');
	if (typeof opts.interval !== 'number') throw new Error('interval must be specified');
	if (typeof opts.convert !== 'function') {
		opts.convert = convertFunctions[opts.channel];
		if (typeof opts.convert !== 'function') throw new Error(`convert for channel ${opts.channel} must be specified`);
	}
	if (typeof opts.retries !== 'number') opts.retries = 3;
}

function factory (opts, input, output) {
	const filePath = path.join('/sys/bus/iio/devices', opts.device, opts.channel);
	return intervalFileRead({
		...opts,
		filePath,
		processData: (data) => {
			if (!data.trim()) {
				return Promise.reject(new Error('Read data is empty'));
			}
			const value = opts.convert(data);
			output[0].value = value;
		}
	});
}

module.exports = {check, factory};
