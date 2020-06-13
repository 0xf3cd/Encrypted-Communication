const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Functions for encryption  and decryption
const encryptPub = (key, data) => {
    return crypto.publicEncrypt(key.toString(), Buffer.from(data));
};

const decryptPub = (key, data) => {
    return crypto.publicDecrypt(key.toString(), Buffer.from(data));
};

const encryptPriv = (key, passphrase, data) => {
    return crypto.privateEncrypt({
        key: key.toString(),
        passphrase: passphrase
    }, Buffer.from(data));
};

const decryptPriv = (key, passphrase, data) => {
    return crypto.privateDecrypt({
        key: key.toString(),
        passphrase: passphrase
    }, Buffer.from(data));
};

const genRandomBytes = (len) => {
    return crypto.randomBytes(len);
};

// Generate passphrase and keys
const generateKeys = (dir='.') => {
    const randomPassPhrase = genRandomBytes(32).toString('hex');
    const keys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: 'aes-256-cbc',
          passphrase: randomPassPhrase
        }
    });

    fs.writeFileSync(path.join(dir, 'pubKey.pem'), keys.publicKey);
    fs.writeFileSync(path.join(dir, 'privKey.pem'), keys.privateKey);
    fs.writeFileSync(path.join(dir, 'passphrase'), randomPassPhrase);
};

// Read the keys and passphrase
const loadPublicKey = (dir='.') => {
    if(!fs.existsSync(path.join(dir, 'pubKey.pem'))) {
        throw `${path.join(dir, 'pubKey.pem')} not existing!`;
    }
    return pubKey = fs.readFileSync(path.join(dir, 'pubKey.pem'));
};

const loadPrivateKey = (dir='.') => {
    if(!fs.existsSync(path.join(dir, 'privKey.pem'))) {
        throw `${path.join(dir, 'privKey.pem')} not existing!`;
    }
    if(!fs.existsSync(path.join(dir, 'passphrase'))) {
        throw `${path.join(dir, 'passphrase')} not existing!`;
    }
    const privKey = fs.readFileSync(path.join(dir, 'privKey.pem'));
    const passphrase = fs.readFileSync(path.join(dir, 'passphrase'));
    return { privKey, passphrase };
};

module.exports = {
    encryptPub,
    decryptPub,
    encryptPriv,
    decryptPriv,
    genRandomBytes,
    generateKeys,
    loadPublicKey,
    loadPrivateKey
};