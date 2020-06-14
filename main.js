#!/usr/bin/env node

const { getServer } = require('./server.js');
const { getClient } = require('./client.js');
const program = require('commander');
const { addColor, print } = require('./colors.js');
const {
    loadPublicKey,
    loadPrivateKey,
    genRandomBytes
} = require('./encrypt.js');
const readline = require('readline');
const fs = require('fs');
const events = require("events");

program
    .version('0.1.0')
    .option('-s, --server', 'Run server')
    .option('-c, --client', 'Run client')
    .option('-pp, --passphrase [passphrase]', 'Specify the dir to passphrase')
    .option('-pubk --publickey [publickey]', 'Specify the dir to public key')
    .option('-privk --privatekey [privatekey', 'Specify the dir to private key')
    .option('-ip, --ip [ip]', 'For clients, specify server ip address to connect [ip]')
    .option('-p, --port [port]', 'Specify the port to connect to or listen on', '8000')
    // .option('-fd --filedir [filedir]', 'Specify the file to be sent')
    .parse(process.argv);

if(program.server) {
    if(!program.port) {
        throw addColor('Please specify the port to listen on (-p/--port)', 'green');
    }

    const pubKey = loadPublicKey();
    const server = getServer(pubKey, parseInt(program.port));
    print(`Server listening on ${program.port}\n`);
    // server.listen(parseInt(program.port), () => {
    //     
    // });
} else if(program.client) {
    if(!program.ip) {
        throw addColor('Please specify the ip to connect (-ip/--ip)', 'green');
    }
    if(!program.port) {
        throw addColor('Please specify the port to listen on (-p/--port)', 'green');
    }

    const { privKey, passphrase } = loadPrivateKey();
    const emitter = new events.EventEmitter();
    let client = getClient(privKey, passphrase, program.ip, program.port, emitter);

    emitter.addListener('client-close', () => {
        print(`Lost the connection to the server!!!!\n`, 'red');
        print(`Trying to reconnect in 3 seconds! So don't worry!\n`);
        setTimeout(() => {
            client.terminate();
            client = getClient(privKey, passphrase, program.ip, program.port, emitter);
        }, 3000);
    });
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.on('line', (input) => {
        if(input === 'test') {
            client.mySend(genRandomBytes(65536*16).toString('base64'), type='test');
        } else if(input === 'file') {
            const fileContent = fs.readFileSync('./server.js');
            client.mySend(fileContent, type='file');
        } else if(input === 'shell') {
            client.mySend('ls -la', type='shell');
        } else {
            client.mySend(input, type='data');
        }
    });
    
    rl.on('close', () => {
        print('Bye!\n', 'yellow');
    });
    return rl;

} else {
    throw 'Please specify the mode to work on (-c/--client or -s/--server)';
}