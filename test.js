const {createBlankDisk, openDisk} = require('./');

testCreateBlank();
testOpen();

function testCreateBlank() {
    const disk = createBlankDisk(256, 4);
    checkDisk(disk, 256, 4);
}

function testOpen() {
    const disk = openDisk(createBlankDisk(256, 8)._image.buffer);
    checkDisk(disk, 256, 8);
}

function checkDisk(disk, blockSize, blockCount) {
    assert(disk.blockSize === blockSize);
    assert(disk.blockCount === blockCount);
    assert(disk._image.length === blockSize * blockCount);
    assert(disk._image[0] === 'R'.charCodeAt(0));
    assert(disk._image[1] === 'E'.charCodeAt(0));
    assert(disk._image[2] === 'A'.charCodeAt(0));
    assert(disk._image[3] === 'D'.charCodeAt(0));
    assert(disk._image[4] === 'Y'.charCodeAt(0));
    assert(disk._image[5] === 'O'.charCodeAt(0));
    assert(disk._image[6] === 'K'.charCodeAt(0));
    assert(disk._image[7] === 0);
    
    const blockInfo = new Uint32Array(disk._image.buffer, 8, 2);
    assert(blockInfo[0] === blockSize);
    assert(blockInfo[1] === blockCount);
}

function assert(ok, msg) {
    if (!ok) throw new Error(msg || "assert failed");
}
