const qsem = require('qsem');
const fs = require('fs');
const fsReadFile = (file) => new Promise((resolve, reject) => fs.readFile(file, (err, data) => {
	if (err) reject(err);
	else resolve(data.toString());
}));

function factory (opts) {
	// Semaphore for throtteling reads
	const sem = qsem(1);

	// Setup interval for reading data
	const handler = setInterval(() => nextRead(), opts.interval);
	function nextRead () {
		// retries must be in the current execution conext.
		// If nextRead() is called again, a new context is generated
		// and, thus, retries is another variable!
		var retries = opts.retries;

		// Read once obtained the semaphore's token
		sem.limit(readFile);
		function readFile () {
			return fsReadFile(opts.filePath).then(opts.processData).catch(() => {
				if (!retries) return;
				// If retries are left append a new readFile to the then-chain.
				retries -= 1;
				return readFile();
			});
		}
	}

	return () => {
		clearInterval(handler);
		// Make sure that all reads has finished befor resolving the exit promise.
		return sem.enter();
	};
}

module.exports = factory;
