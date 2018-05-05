const EventEmitter = require('events');

const {
	readFixedLengthAsciiString,
	writeFixedLengthAsciiString
} = require('@fantasyarcade/uint8array-utils');

const DiskHeader = 'READYOK';
const DiskHeaderSize = DiskHeader.length + 1;

const MinBlockSize = 128;
const MaxBlockSize = 4096;

exports.createBlankDisk = function(blockSize, blockCount) {
	validateBlockInfo(blockSize, blockCount);
	const buffer = new ArrayBuffer(blockSize * blockCount);
	writeFixedLengthAsciiString(new Uint8Array(buffer), 0, DiskHeaderSize, DiskHeader);
	const blockInfo = new Uint32Array(buffer, DiskHeaderSize, 2);
	blockInfo[0] = blockSize;
	blockInfo[1] = blockCount;
	return new Disk(blockSize, blockCount, buffer);
}

exports.openDisk = function(data) {
	if (!(data instanceof ArrayBuffer)) {
		throw new TypeError("Disk data must be an ArrayBuffer");
	}
	if (readFixedLengthAsciiString(new Uint8Array(data), 0, 8) !== DiskHeader) {
		throw new Error("Invalid disk header");
	}
	const blockInfo = new Uint32Array(data, DiskHeaderSize, 2);
	validateBlockInfo(blockInfo[0], blockInfo[1]);
	return new Disk(blockInfo[0], blockInfo[1], data);
}

class Disk {
	constructor(blockSize, blockCount, buffer) {
		this.blockSize = blockSize;
		this.blockCount = blockCount;
		this.events = new EventEmitter();
		this._image = new Uint8Array(buffer);
	}

	readBlock(ix) {
		this._validateBlock(ix);
		return this._image.slice(ix * this.blockSize, this.blockSize);
	}

	writeBlock(ix, data) {
		this._validateBlock(ix);
		if (ix === 0) {
			throw new RangeError("Cannot write to block 0");
		}
		if (data.length !== this.blockSize) {
			throw new Error("Block data length must be equal to block size");
		}
		const base = ix * this.blockSize;
		for (let p = 0; p < data.length; ++p) {
			this._image[base + p] = data[p];
		}
		this.events.emit('write', ix, data);
	}

	_validateBlock(ix) {
		if (typeof ix !== 'number') {
			throw new TypeError("Block index must be numeric");
		}
		if (ix < 0 || ix >= this.blockCount) {
			throw new RangeError("Invalid block: " + ix);
		}
	}
}

function validateBlockInfo(size, count) {
	if (size < MinBlockSize || size > MaxBlockSize) {
		throw new RangeError(`Invalid block size, must be in range ${MinBlockSize}..${MaxBlockSize}`);
	}
	// TODO: ensure blockSize is multiple of 2
	// TODO: block count
}