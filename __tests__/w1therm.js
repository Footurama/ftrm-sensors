const path = require('path');

jest.mock('../lib/intervalFileRead.js');
const mockIntervalFileRead = require('../lib/intervalFileRead.js');

const W1THERM = require('../w1therm.js');

describe('check', () => {
	test('expect zero inputs', () => {
		try {
			W1THERM.check({
				input: [ {} ],
				output: [ {} ],
				sensorSerial: '',
				interval: 1000
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('No inputs can be specified');
		}
	});

	test('expect one output', () => {
		try {
			W1THERM.check({
				input: [],
				output: [],
				sensorSerial: '',
				interval: 1000
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One output must be specified');
		}
	});

	test('expect sensorSerial', () => {
		try {
			W1THERM.check({
				input: [],
				output: [ {} ],
				interval: 1000
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('sensorSerial must be specified');
		}
	});

	test('expect interval', () => {
		try {
			W1THERM.check({
				input: [],
				output: [ {} ],
				sensorSerial: '12-345676890'
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('interval must be specified');
		}
	});

	test('default retries to 3', () => {
		const opts = {
			input: [],
			output: [ {} ],
			sensorSerial: '12-345676890',
			interval: 1234
		};
		W1THERM.check(opts);
		expect(opts.retries).toBe(3);
	});
});

describe('factory', () => {
	test('expose interval and retries', () => {
		const interval = 123;
		const retries = 456;
		W1THERM.factory({sensorSerial: '', interval, retries});
		expect(mockIntervalFileRead.mock.calls[0][0]).toMatchObject({
			interval,
			retries
		});
	});

	test('expose exit function', () => {
		const e = jest.fn();
		expect(mockIntervalFileRead.mockImplementationOnce(() => e));
		const exit = W1THERM.factory({sensorSerial: ''});
		expect(exit).toBe(e);
	});

	test('read from w1_slave file', () => {
		const sensorSerial = '12-3456789';
		W1THERM.factory({sensorSerial});
		expect(mockIntervalFileRead.mock.calls[0][0].filePath).toEqual(path.join('/sys/bus/w1/devices', sensorSerial, 'w1_slave'));
	});

	test('interprete data from file', async () => {
		const temp = -16062;
		const data = [
			`01 01 4b 46 7f ff 0f 10 e3 : crc=e3 YES`,
			`01 01 4b 46 7f ff 0f 10 e3 t=${temp}`,
			``
		].join('\n');
		const output = {};
		W1THERM.factory({sensorSerial: ''}, [], [output]);
		mockIntervalFileRead.mock.calls[0][0].processData(data);
		expect(output.value).toBe(temp / 1000);
	});

	test('ignore wrong CRC', async () => {
		const data = [
			`01 01 4b 46 7f ff 0f 10 e3 : crc=e3 NO`,
			`01 01 4b 46 7f ff 0f 10 e3 t=12345`,
			``
		].join('\n');
		const output = {};
		W1THERM.factory({sensorSerial: ''}, [], [output]);
		const q = mockIntervalFileRead.mock.calls[0][0].processData(data);
		expect(output.value).toBeUndefined();
		expect(q).rejects.toThrowError();
	});

	test('ignore non-parsable file content', async () => {
		const data = [
			`01 01 4b 46 7f ff 0f 10 e3 : crc=e3 YES`,
			`01 01 4b 46 7f ff 0f 10 e3 t=`,
			``
		].join('\n');
		const output = {};
		W1THERM.factory({sensorSerial: ''}, [], [output]);
		const q = mockIntervalFileRead.mock.calls[0][0].processData(data);
		expect(output.value).toBeUndefined();
		expect(q).rejects.toThrowError();
	});

	test('ignore empty file content', async () => {
		const data = '';
		const output = {};
		W1THERM.factory({sensorSerial: ''}, [], [output]);
		const q = mockIntervalFileRead.mock.calls[0][0].processData(data);
		expect(output.value).toBeUndefined();
		expect(q).rejects.toThrowError();
	});
});
