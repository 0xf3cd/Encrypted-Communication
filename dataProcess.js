const { print } = require('./colors.js');
const { genRandomBytes } = require('./encrypt.js');
const zlib = require('zlib');

const MAX_BLK_NUM = 65536 / 512 - 1;

const splitData = (data, segLen=501) => { // 501 + 11 (11 for padding) == 512
    const dataLen = data.length;
    const segNum = Math.ceil(dataLen / segLen);
    const slicedData = [];
    for(let i = 0; i < segNum; i++) {
        const partData = data.slice(i*segLen, i*segLen+segLen);
        slicedData.push(partData);
    }
    return slicedData;
};

const send = (socket, encryptFunc, data, type='data', use_compress=true) => {
    if(!data) {
        data = '\0';
    }

    const head = {
        type: type,
        use_compress: use_compress
    };

    let compressedData = data; // if use_compress is false, then do not compress the data 
    if(head.use_compress) {
        compressedData = zlib.deflateRawSync(data);
    }

    const slicedData = splitData(compressedData);
    const slicedNum = slicedData.length;
    let encryptedData = [];
    // console.log(slicedData[0].length)

    if(slicedNum > 1) {
        print(`Data is too long! The data is splited into ${slicedNum} parts.\n`, 'red');
        for(let i = 0; i < slicedNum; i++) {
            const encryptedPartData = encryptFunc(slicedData[i]);
            encryptedData.push(encryptedPartData);
        }
    } else {
        const encryptedPartData = encryptFunc(slicedData[0]);
        encryptedData.push(encryptedPartData);
    }

    const reqID = genRandomBytes(32).toString('base64');

    print(`Original Data Length: ${data.length}\n`, 'yellow');
    print(`Compressed Data Length: ${compressedData.length}\n`, 'yellow');
    if(slicedNum <= MAX_BLK_NUM) {
        head.req_id = reqID
        head.blk_num = slicedNum;
        head.origin_data_bytes = data.length;
        head.compressed_data_bytes = compressedData.length;
        head.all_bytes = (slicedNum + 1) * 512;
        head.use_seg = false;
        head.seg_num = 0;
        head.cur_seg_no = 0;
        const encryptedHead = encryptFunc(JSON.stringify(head));
        encryptedData.unshift(encryptedHead);
        
        const bufToSend = Buffer.concat(encryptedData, encryptedData.length*512);
        print(`Encrtyped Data Frame Length: ${bufToSend.length}\n`, 'yellow');
        socket.send(bufToSend);
    } else {
        const segNum = Math.ceil(slicedNum/MAX_BLK_NUM);
        print(`Data is too long! The data is sent in ${segNum} segments.\n`, 'red');
        for(let i = 0; i < segNum; i++) {
            let segBlkNum = Math.min(MAX_BLK_NUM, slicedNum - i * MAX_BLK_NUM);

            head.req_id = reqID
            head.blk_num = segBlkNum;
            head.origin_data_bytes = data.length;
            head.compressed_data_bytes = compressedData.length;
            head.all_bytes = (segBlkNum + 1) * 512;
            head.use_seg = true;
            head.seg_num = segNum
            head.cur_seg_no = i+1;
            const encryptedHead = encryptFunc(JSON.stringify(head));

            const segEncryptedData = [];
            segEncryptedData.push(encryptedHead);
            for(let j = i*MAX_BLK_NUM; j < (i+1)*MAX_BLK_NUM && j < slicedNum; j++) {
                segEncryptedData.push(encryptedData[j]);
            }
            
            const bufToSend = Buffer.concat(segEncryptedData, segEncryptedData.length*512);
            print(`Encrtyped Data Frame Length: ${bufToSend.length}\n`, 'yellow');
            socket.send(bufToSend); 
        }
    }

    
    print(`All the data has been sent.\n`, 'yellow');
};

module.exports = {
    send,
    MAX_BLK_NUM
};