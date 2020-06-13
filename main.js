#!/usr/bin/env node

const crypto = require('crypto');
const readline = require('readline');
const fs = require('fs');
const net = require('net');
const program = require('commander');
const { addColor, print } = require('./colors.js');
const {
    encryptPub,
    decryptPub,
    encryptPriv,
    decryptPriv,
    genRandomBytes,
    generateKeys,
    loadPublicKey,
    loadPrivateKey
} = require('./encrypt.js');

program
    .version('0.1.0')
    .option('-s, --server', 'Run server')
    .option('-c, --client', 'Run client')
    .option('-pp, --passphrase [passphrase]', 'Specify the dir to passphrase')
    .option('-pubk --publickey [publickey]', 'Specify the dir to public key')
    .option('-privk --privatekey [privatekey', 'Specify the dir to private key')
    .option('-ip, --ip [ip]', 'For clients, specify server ip address to connect [ip]', '127.0.0.1')
    .option('-p, --port [port]', 'Specify the port to connect to or listen on', '8000')
    .parse(process.argv);

if(program.server) {
    if(!program.port) {
        throw 'Please specify the port to listen on (-p/--port)';
    }
    const pubKey = loadPublicKey();
    const server = net.createServer((c) => {
        console.log(`Client connected, from ${c.ip}`);
        c.on('end', () => {
            console.log(`Client disconnected, ip: ${c.ip}`);
        });
        c.on('data', (d) => {
            print('\n--------\n');
            print(`Received encrypted data from ${c.ip}\n`, 'green');
            print('Encrypted: ', 'yellow');
            print(`${d}\n`);
            print('Decrypted: ', 'yellow');
            print(`${decryptPub(pubKey, d)}\n`);
            print('--------\n');
            c.write(`${encryptPub(pubKey, Date().toString())}`);
        });
        c.write(`${encryptPub(pubKey, `Hello from server! - ${Date().toString()}`)}\n`);
    });
      
    server.listen(parseInt(program.ip), () => {
        print(`Server listening on ${program.ip}`);
    });
} else if(program.client) {
    if(!program.ip) {
        throw 'Please specify the ip to connect (-ip/--ip)';
    }
    if(!program.port) {
        throw 'Please specify the port to listen on (-p/--port)';
    }

} else {
    throw 'Please specify the mode to work on (-c/--client or -s/--server)';
}


  
const randomBytes = genRandomBytes(64).toString('hex');
const encodedBytes = encrypt(pubKey, randomBytes);
const decodedBytes = decrypt(privKey, passphrase, encodedBytes);
console.log(`${'\033[32m'}Random bytes${'\033[0m'}: ${randomBytes}`);
console.log(`${'\033[32m'}Encrypted bytes${'\033[0m'}: ${encodedBytes.toString('hex')}`);
console.log(`${'\033[32m'}Decrypted bytes${'\033[0m'}: ${decodedBytes}`);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    // console.log(`${'\033[32m'}PID-${process.pid} received${'\033[0m'}: ${input}`);
    const encryptedInput = encrypt(pubKey, input);
    const decryptedInput = decrypt(privKey, passphrase, encryptedInput);
    console.log(`${addColor('Received', 'green')}: ${input}`);
    console.log(`${addColor('Encrypted', 'green')}: ${encryptedInput.toString('hex')}`);
    console.log(`${addColor('Decrypted', 'green')}: ${decryptedInput}`);
});

rl.on('close', () => {
    console.log(`${addColor(`PID-${process.pid} said`, 'yellow')}: Bye!`);
});

console.log(addColor(`Hello from process (PID ${process.pid})`, 'yellow'));
