const WebSocket = require('ws');
const { addColor, print, printSys } = require('./colors.js');
const {
    encryptPub,
    decryptPub,
    genRandomBytes,
} = require('./encrypt.js');
const {
    send,
    MAX_BLK_NUM,
} = require('./dataProcess.js');
const zlib = require('zlib');

const getServerEncrypt = (pubKey) => {
    const encrypt = (data) => {
        return encryptPub(pubKey, data)
    };
    return encrypt;
};

const getServerDecrypt = (pubKey) => {
    const decrypt = (data) => {
        return decryptPub(pubKey, data)
    };
    return decrypt;
};

const procFile = (fileContent) => {
    print('File Content: ', 'yellow');
    print(`${fileContent}\n`);
    print('--------\n\n');
};

const processDataServer = (head, chunks, decrypt) => {
    print('\n--------\n');
    print(`Received All Data of req_id `);
    print(`${head.req_id}\n`, 'red');
    print(`Received Data is of Type `);
    print(`${head.type}\n`, 'red');

    const processFuncs = {
        'file': procFile
    };

    const msgType = head.type;
    const chunkSize = chunks.size;

    const decryptedData = [];
    for(let i = 1; i <= chunkSize; i++) {
        const dataSlice = chunks.get(i);
        decryptedData.push(decrypt(dataSlice));
    }

    let decryptedDataBuf = Buffer.concat(decryptedData);
    let decryptedDataStr = '';
    if(head.use_compress) {
        decryptedDataStr = zlib.inflateRawSync(decryptedDataBuf).toString();
    } else {
        decryptedDataStr = decryptedDataBuf.toString();
    }

    if(processFuncs.hasOwnProperty(msgType)) {
        const func = processFuncs[msgType];
        func(decryptedDataStr);
    } else {
        print('Decrypted Data: ', 'yellow');
        print(`${decryptedDataStr}\n`);
        print('--------\n\n');
    }
};

const getServer = (pubKey, port) => {
    const encrypt = getServerEncrypt(pubKey);
    const decrypt = getServerDecrypt(pubKey);

    const server = new WebSocket.Server({ port: port});
    server.on('connection', (c, req) => {
        const clientIP = req.socket.remoteAddress;

        c.on('close', () => {
            console.log(`Client disconnected, ip: ${clientIP}`);
        });

        const chunkMap = new Map();
        c.on('message', (d) => {
            print('\n--------\n');
            print(`Received encrypted data from ${clientIP}\n`, 'green');
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
                processDataServer(parsedHead, chunks, decrypt);
                chunkMap.delete(reqID);
            }

            const dataReply = `Server has received the data with length ${d.length} - ${addColor(Date().toString(), 'green')}`;
            send(c, encrypt, dataReply, type='data-confirm');
        });

        // Say hi to client!
        const randomBytes = genRandomBytes(64).toString('hex');
        print(`Client connected, from ${req.socket.remoteAddress}\n`);
        print(`Random string: `, 'green');
        print(`${randomBytes}\n`);
         
        const dataBack = `Hello from server! - ${addColor(Date().toString(), 'green')}`;
        send(c, encrypt, dataBack);
        const randomInfo = `Random string generated by server: ${randomBytes}`;
        send(c, encrypt, randomInfo, type='random-bytes');
    });
    return server;
};

module.exports = {
    getServer
};