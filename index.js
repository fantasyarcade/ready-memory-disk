const {EventEmitter} = require('events');

function gencons(target, map) {
    for (let k in map) {
        target[k] = map[k];
    }
    return map;
}

function gensyms(target, names) {
    const out = {};
    names.forEach(n => { out[n] = Symbol(n); });
    return gencons(target, out);
}

const {
    DiskActivityRead,
    DiskActivityWrite
} = gencons(exports, {
    DiskActivityRead: 0x01,
    DiskActivityWrite: 0x02
});

const {
    EvDriveActivity
} = gensyms(exports, [
    'EvDriveActivity'
]);

exports.MemoryDisk = class MemoryDisk extends EventEmitter {
    constructor(diskImage) {
        super();
        this._disk = diskImage;
        this.blocksRead = 0;
        this.blocksWritten = 0;
    }

    get blockSize() { return this._disk.blockSize; }
    get blockCount() { return this._disk.blockCount; }
    get fileSystemType() { return this._disk.fileSystemType; }

    zero(block, count) {
        let err = this._validateBlockRange(startBlock, count);
        if (err !== true) {
            return err;
        }
        
        const startBlock = block;
        const endBlock = block + count;
        while (block < endBlock) {
            this._disk.zeroBlock(block);
            startBlock++;
            this.blocksWritten++;
        }
        
        this._invalidate('z', startBlock, count);
        this.emit(EvDriveActivity, DiskActivityWrite);
        
        return true;
    }
    
    write(block, blockCount, data) {
        let err = this._validateBlockRange(block, blockCount);
        if (err !== true) {
            return err;
        }

        err = this._validateBufferSize(blockCount, data);
        if (err !== true) {
            return err;
        }

        const startBlock = block;
        const bs = this.blockSize;
        let offset = 0;
        while (offset < data.length) {
            const endOffset = offset + bs;
            this._disk.writeBlock(startBlock, data.subarray(offset, endOffset));
            startBlock++;
            offset = endOffset;
            this.blocksWritten++;
        }
        
        this._invalidate('w', block, blockCount);
        this.emit(EvDriveActivity, DiskActivityWrite);

        return true;

    }
    
    read(startBlock, blockCount, outBuffer) {
        let err = this._validateBlockRange(startBlock, blockCount);
        if (err !== true) {
            return err;
        }

        err = this._validateBufferSize(blockCount, outBuffer);
        if (err !== true) {
            return err;
        }

        const bs = this.blockSize;
        let offset = 0;
        while (offset < outBuffer.length) {
            const endOffset = offset + bs;
            this._disk.readBlock(startBlock, outBuffer.subarray(offset, endOffset));
            startBlock++;
            offset = endOffset;
            this.blocksRead++;
        }

        this.emit(EvDriveActivity, DiskActivityRead);

        return true;
    }

    _validateBlockRange(startBlock, count) {
        if (startBlock < 1
            || count < 1
            || startBlock >= this.blockCount
            || (startBlock + count) > this.blockCount) {
            return ErrInvalidBlockRange;
        }
        return true;
    }

    _validateBufferSize(blockCount, buffer) {
        if ((blockCount * this.blockSize) !== buffer.length) {
            return ErrInvalidBufferSize;
        }
        return true;
    }

    _invalidate(op, startBlock, blockCount) {
        // TODO: trigger sync etc.
    }
};