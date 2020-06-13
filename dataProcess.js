const { print } = require('./colors.js');

const splitData = (data, segLen=256) => {
    const dataLen = data.length;
    const segNum = Math.ceil(dataLen / segLen);
    const slicedData = [];
    for(let i = 0; i < segNum; i++) {
        const partData = data.slice(i*segLen, i*segLen+segLen);
        slicedData.push(partData);
    }
    return slicedData;
};

const concatData = (slicedDataMap, segLen=256) => {
    let data = '';
    const mapSize = slicedDataMap.size;

    for(let k = 1; k <= mapSize; k++) {
        data += slicedDataMap.get(k);
    }
    return data;
};

const send = (socket, encryptFunc, data, type='data') => {
    if(!data) {
        data = '\0';
    }

    const slicedData = splitData(data);
    const slicedNum = slicedData.length;
    let encryptedData = [];

    if(slicedNum > 1) {
        print(`Data is too long! The data is splited into ${slicedNum} parts.\n`, 'red');
        for(let i = 0; i < slicedNum; i++) {
            const encryptedPartData = encryptFunc(slicedData[i]).toString('hex');
            encryptedData.push(encryptedPartData);
        }
    } else {
        const encryptedPartData = encryptFunc(slicedData[0]).toString('hex');
        encryptedData.push(encryptedPartData);
    }

    const dataToSend = JSON.stringify({
        data: encryptedData,
        type: type,
    });

    socket.write(dataToSend);
    print(`All the data has been sent.\n`, 'yellow');
};

// console.log(splitData('1'.repeat(8946354)));
// console.log(concatData(splitData('1'.repeat(8946354))).length);
module.exports = {
    concatData,
    send
};