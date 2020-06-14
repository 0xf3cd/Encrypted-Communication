const WebSocket = require('ws');
const { addColor, print, printSys } = require('./colors.js');
const {
    encryptPriv,
    decryptPriv
} = require('./encrypt.js');
const {
    send,
    MAX_BLK_NUM,
    processDataClient
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

const getClient = (privKey, passphrase, host, port) => {
    let client = new WebSocket(`ws://${host}:${port}`);
    const encrypt = getClientEncrypt(privKey, passphrase);
    const decrypt = getClientDecrypt(privKey, passphrase);

    const chunkMap = new Map();
    client.on('message', (d) => {
        print('\n--------\n');
        print(`Received encrypted data from server\n`, 'green');
        print('Encrypted: ', 'yellow');
        print(`${d.toString('base64')}\n`);

        const head = d.slice(0, 512);
        const parsedHead = JSON.parse(decrypt(head));
        print(`Decrypted Head: `, 'yellow');
        printSys(parsedHead);
        print('Actually received data length: ', 'yellow');
        print(`${d.length}\n`);
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

    client.mySend = (data, type='data') => {
        send(client, encrypt, data, type=type);
    };

    // reconnect to the server when losing the connection
    client.on('close', () => {
        print(`Lost the connection to the server!!!!\n`, 'red');
        print(`Trying to reconnect in 3 seconds! So don't worry!\n`);
        setTimeout(() => {
            client.terminate();
            client = getClient(privKey, passphrase, host, port);
        }, 3000);
    });

    return client;
};

module.exports = {
    getClient
};
