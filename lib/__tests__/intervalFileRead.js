jest.mock('fs');
const mockFs = require('fs');

jest.useFakeTimers();
afterEach(() => jest.clearAllTimers());

const intervalFileRead = require('../intervalFileRead.js');

const immediate = () => new Promise((resolve) => setImmediate(resolve));

test('read file after given interval', async () => {
	const data = 'testdata';
	const dataRaw = Buffer.from(data);
	mockFs.readFile.mockImplementationOnce((f, cb) => cb(null, dataRaw));
	const processData = jest.fn();
	const interval = 1000;
	const filePath = 'abc';
	intervalFileRead({processData, interval, filePath});
	await immediate();
	expect(processData.mock.calls.length).toBe(0);
	jest.advanceTimersByTime(interval);
	await immediate();
	expect(processData.mock.calls[0][0]).toEqual(data);
	expect(mockFs.readFile.mock.calls[0][0]).toEqual(filePath);
});

test('do not run readFile again if reads from the past are still processed', async () => {
	const processDataDeferred = [];
	const processData = jest.fn(() => new Promise((resolve) => processDataDeferred.push(resolve)));
	const interval = 1000;
	intervalFileRead({processData, interval, filePath: 'abc'});
	jest.advanceTimersByTime(interval);
	await immediate();
	jest.advanceTimersByTime(interval);
	await immediate();
	expect(mockFs.readFile.mock.calls.length).toBe(1);
	processDataDeferred[0]();
	await immediate();
	expect(mockFs.readFile.mock.calls.length).toBe(2);
});

test('stop the interval once exit has been called', async () => {
	const interval = 1000;
	const exit = intervalFileRead({processData: () => {}, interval, filePath: 'abc'});
	jest.advanceTimersByTime(interval);
	await immediate();
	expect(mockFs.readFile.mock.calls.length).toBe(1);
	exit();
	jest.advanceTimersByTime(interval);
	await immediate();
	expect(mockFs.readFile.mock.calls.length).toBe(1);
});

test('wait for the last read to exit before returning the exit call', async() => {
	const processDataDeferred = [];
	const processData = jest.fn(() => new Promise((resolve) => processDataDeferred.push(resolve)));
	const interval = 1000;
	const exit = intervalFileRead({processData, interval, filePath: 'abc'});
	jest.advanceTimersByTime(interval);
	await immediate();
	const onExit = jest.fn();
	exit().then(onExit);
	expect(onExit.mock.calls.length).toBe(0);
	processDataDeferred[0]();
	await immediate();
	expect(onExit.mock.calls.length).toBe(1);
});

test('retry if something wents wrong', async () => {
	const interval = 123;
	const retries = 1;
	const processData = jest.fn();
	mockFs.readFile.mockImplementationOnce((f, cb) => cb(new Error()));
	intervalFileRead({processData, interval, filePath: 'abc', retries});
	jest.advanceTimersByTime(interval);
	await immediate();
	expect(mockFs.readFile.mock.calls.length).toBe(2);
	expect(processData.mock.calls.length).toBe(1);
});
