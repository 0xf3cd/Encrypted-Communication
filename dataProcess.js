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
    const slicedData = splitData(data);
    const slicedNum = slicedData.length;

    if(slicedNum > 1) {
        print(`Data is too long! The data is splited into ${slicedNum} parts.\n`, 'red');

        // slice the data into several parts 
        // if the data is too long, then the encryption will fail
        for(let i = 0; i < slicedNum; i++) {
            const dataToSend = JSON.stringify({
                data: slicedData[i],
                type: type,
                seg_no: i+1,
                seg_num: slicedNum
            })
            socket.write(encryptFunc(dataToSend));
            print(`Part ${i+1} has been sent.\n`, 'yellow');
        }
    } else {
        const dataToSend = JSON.stringify({
            data: slicedData[0],
            type: type,
            seg_no: 1,
            seg_num: 1
        })
        socket.write(encryptFunc(dataToSend));
    }
    print(`All the data has been sent.\n`, 'yellow');
};

// console.log(splitData('1'.repeat(8946354)));
// console.log(concatData(splitData('1'.repeat(8946354))).length);
module.exports = {
    concatData,
    send
};