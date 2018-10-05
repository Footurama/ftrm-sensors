const path = require('path');

jest.mock('../lib/intervalFileRead.js');
const mockIntervalFileRead = require('../lib/intervalFileRead.js');

const IIO = require('../iio.js');

describe('check', () => {
	test('expect zero inputs', () => {
		try {
			IIO.check({
				input: [ {} ],
				output: [ {} ],
				device: '',
				channel: 'in_temp_input',
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
			IIO.check({
				input: [],
				output: [],
				device: '',
				channel: 'in_temp_input',
				interval: 1000
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One output must be specified');
		}
	});

	test('expect device', () => {
		try {
			IIO.check({
				input: [],
				output: [ {} ],
				channel: 'in_temp_input',
				interval: 1000
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('device must be specified');
		}
	});

	test('expect channel', () => {
		try {
			IIO.check({
				input: [],
				output: [ {} ],
				interval: 1000,
				device: 'abc'
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('channel must be specified');
		}
	});

	test('expect interval', () => {
		try {
			IIO.check({
				input: [],
				output: [ {} ],
				device: '12-345676890',
				channel: 'in_temp_input'
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
			device: '',
			channel: 'in_temp_input',
			interval: 1234
		};
		IIO.check(opts);
		expect(opts.retries).toBe(3);
	});

	test('expect convert function in channel is unknown', () => {
		const channel = 'abc';
		try {
			IIO.check({
				input: [],
				output: [ {} ],
				device: '12-345676890',
				interval: 1234,
				channel
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual(`convert for channel ${channel} must be specified`);
		}
	});

	[
		{channel: 'in_temp_input', data: '12345\n', value: 12.345},
		{channel: 'in_humidityrelative_input', data: '12345\n', value: 12.345}
	].forEach((testCase) => test(`default convert for ${testCase.channel}`, () => {
		const opts = {
			input: [],
			output: [ {} ],
			device: '12-345676890',
			interval: 1234,
			channel: testCase.channel
		};
		IIO.check(opts);
		expect(opts.convert(testCase.data)).toBe(testCase.value);
	}));
});

describe('factory', () => {
	test('expose interval and retries', () => {
		const interval = 123;
		const retries = 456;
		IIO.factory({device: '', channel: '', interval, retries});
		expect(mockIntervalFileRead.mock.calls[0][0]).toMatchObject({
			interval,
			retries
		});
	});

	test('expose exit function', () => {
		const e = jest.fn();
		expect(mockIntervalFileRead.mockImplementationOnce(() => e));
		const exit = IIO.factory({device: '', channel: ''});
		expect(exit).toBe(e);
	});

	test('read from channel file', () => {
		const device = 'iio:device0';
		const channel = 'in_temp_input';
		IIO.factory({device, channel});
		expect(mockIntervalFileRead.mock.calls[0][0].filePath).toEqual(path.join('/sys/bus/iio/devices', device, channel));
	});

	test('convert input data', () => {
		const inData = '12345\n';
		const outData = 12.345;
		const convert = () => outData;
		const output = {};
		IIO.factory({device: '', channel: '', convert}, [], [output]);
		mockIntervalFileRead.mock.calls[0][0].processData(inData);
		expect(output.value).toBe(outData);
	});

	test('ignore empty file content', async () => {
		const inData = '\n';
		const convert = jest.fn();
		const output = {};
		IIO.factory({device: '', channel: '', convert}, [], [output]);
		const q = mockIntervalFileRead.mock.calls[0][0].processData(inData);
		expect(output.value).toBeUndefined();
		expect(convert.mock.calls.length).toBe(0);
		expect(q).rejects.toThrowError();
	});
});
