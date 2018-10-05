module.exports.readFile = jest.fn((file, cb) => cb(null, Buffer.alloc(0)));
