#!/usr/bin/env node

const { getServer } = require('./server.js');
const { getClient } = require('./client.js');
const program = require('commander');
const { addColor, print } = require('./colors.js');
const {
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
    .option('-ip, --ip [ip]', 'For clients, specify server ip address to connect [ip]')
    .option('-p, --port [port]', 'Specify the port to connect to or listen on', '8000')
    .option('-fd --filedir [filedir]', 'Specify the file to be sent')
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
    const client = getClient(privKey, passphrase, program.ip, program.port);
    // client.connect({ port: parseInt(), host:  });

    if(program.filedir) {
        client.sendFile(program.filedir);
    }

} else {
    throw 'Please specify the mode to work on (-c/--client or -s/--server)';
}