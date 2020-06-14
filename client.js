const readline = require('readline');
const net = require('net');
const fs = require('fs');
const { addColor, print, printSys } = require('./colors.js');
const {
    encryptPriv,
    decryptPriv,
} = require('./encrypt.js');
const {
    send,
    MAX_BLK_NUM
} = require('./dataProcess.js');

const getClientEncrypt = (privKey, passphrase) => {
    const encrypt = (data) => {
        return encryptPriv(privKey, passphrase, data)
    };
    return encrypt;
};

const getClientDecrypt = (privKey, passphrase) => {
    const decrypt = (data) => {
        return decryptPriv(privKey, passphrase, data);
    };
    return decrypt;
};

const processDataClient = (head, chunks, decrypt) => {
    print('\n--------\n');
    print(`Received All Data of req_id `);
    print(`${head.req_id}\n`, 'red');
    print(`Received Data is of Type `);
    print(`${head.type}\n`, 'red');

    const chunkSize = chunks.size;

    const decryptedData = [];
    for(let i = 1; i <= chunkSize; i++) {
        const dataSlice = chunks.get(i);
        decryptedData.push(decrypt(dataSlice));
    }

    // console.log(decryptedData);
    let decryptedDataStr = '';
    for(let each of decryptedData) {
        decryptedDataStr += each.toString();
    }
    print('Decrypted Data: ', 'yellow');
    print(`${decryptedDataStr}\n`);
    print('--------\n\n');
};


const getClient = (privKey, passphrase) => {
    const client = new net.Socket();
    const encrypt = getClientEncrypt(privKey, passphrase);
    const decrypt = getClientDecrypt(privKey, passphrase);

    const chunkMap = new Map();
    client.on('data', (d) => {
        print('\n--------\n');
        print(`Received encrypted data from server\n`, 'green');
        print('Encrypted: ', 'yellow');
        print(`${d.toString('base64')}\n`);

        const head = d.slice(0, 512);
        const parsedHead = JSON.parse(decrypt(head));
        print(`Decrypted Head: `, 'yellow');
        printSys(parsedHead);
        print('--------\n\n');

        const reqID = parsedHead.req_id;
        if(!chunkMap.has(reqID)) {
            chunkMap.set(reqID, new Map());
        }
        const chunks = chunkMap.get(reqID);

        for(let i = 1; i <= parsedHead.blk_num; i++) { 
            let chunkKey = 0;
            if(parsedHead.use_seg) {
                chunkKey = (parsedHead.cur_seg_no-1) * MAX_BLK_NUM + i;
            } else {
                chunkKey = i;
            }
            chunks.set(chunkKey, d.slice(512*i, 512*i+512));
        }
        
        if((!parsedHead.use_seg) || (parsedHead.seg_num === parsedHead.cur_seg_no)) {
            processDataClient(parsedHead, chunks, decrypt);
            chunkMap.delete(reqID);
        }
    });
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.on('line', (input) => {
        if(input === 'test') {
            send(client, encrypt, 'a'.repeat(65536));
        } else {
            send(client, encrypt, input);
        }
    });
    
    rl.on('close', () => {
        print('Bye!\n', 'yellow');
    });

    client.sendFile = (fileDir) => {
        const fileData = fs.readFileSync(fileDir).toString();
        console.log(fileData);
        send(client, encrypt, fileData, head={type: 'file'});
    };

    return client;
};

module.exports = {
    getClient
};
