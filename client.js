const readline = require('readline');
const net = require('net');
const fs = require('fs');
const { addColor, print } = require('./colors.js');
const {
    encryptPriv,
    decryptPriv,
} = require('./encrypt.js');
const {
    concatData,
    send
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

const getClient = (privKey, passphrase) => {
    const client = new net.Socket();
    const encrypt = getClientEncrypt(privKey, passphrase);
    const decrypt = getClientDecrypt(privKey, passphrase);

    // let dataReceivedMap = new Map();
    client.on('data', (d) => {
        print('\n--------\n');
        print(`Received encrypted data from server\n`, 'green');
        print('Encrypted: ', 'yellow');
        print(`${d.toString()}\n`);

        const parsedData = JSON.parse(d);
        const messageType = parsedData.type;

        print('Message Type: ', 'yellow');
        print(`${messageType}\n`);

        print('Message length: ', 'yellow');
        print(`${d.length}\n`);

        let restoredData = '';
        for(let each of parsedData.data) {
            const dataBuf = Buffer.from(each, 'hex');
            restoredData += decrypt(dataBuf).toString();
        }

        print('Data length: ', 'yellow');
        print(`${restoredData.length}\n`);

        if(messageType === 'data') {
            print('Decrypted Data: ', 'yellow');
        } else if(messageType === 'random-bytes') {
            print('Decrypted Random Bytes: ', 'yellow');
        }
        print(`${restoredData}\n`);
        print('--------\n\n');
    });
    

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.on('line', (input) => {
        send(client, encrypt, input);
    });
    
    rl.on('close', () => {
        print('Bye!\n', 'yellow');
    });

    client.sendFile = (fileDir) => {
        const fileData = fs.readFileSync(fileDir).toString();
        console.log(fileData)
        send(client, encrypt, fileData, type='file');
    };

    return client;
};

module.exports = {
    getClient
};
