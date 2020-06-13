const readline = require('readline');
const net = require('net');
const { print } = require('./colors.js');
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

    let dataReceivedMap = new Map();
    client.on('data', (d) => {
        print('\n--------\n');
        print(`Received encrypted data from server\n`, 'green');
        print('Encrypted: ', 'yellow');
        print(`${d.toString('hex')}\n`);

        const decryptedJSON = decrypt(d);
        const decryptedData = JSON.parse(decryptedJSON);

        print('Message Type: ', 'yellow');
        print(`${decryptedData.type}\n`);

        print('Message length: ', 'yellow');
        print(`${decryptedJSON.length}\n`);

        print('Data length: ', 'yellow');
        print(`${decryptedData.data.length}\n`);

        print(`Segment: ${decryptedData.seg_no} of ${decryptedData.seg_num}\n`, 'red');
        print('--------\n\n');

        dataReceivedMap.set(decryptedData.seg_no, decryptedData.data);
        if(decryptedData.seg_no === decryptedData.seg_num) {
            const concatedData = concatData(dataReceivedMap);
            dataReceivedMap = new Map();

            print('\n--------\n');
            print('Decrypted: ', 'yellow');
            print(`${concatedData}\n`);
            print('--------\n\n');
        }
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

    return client;
};

module.exports = {
    getClient
};
