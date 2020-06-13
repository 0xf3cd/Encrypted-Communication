# Encrypted-Communication
Use Node.js to build a encrypted server-client communication example

* How to run
    * `npm install` to install required packages
    * server-end: `node main.js -s -p PORT_TO_LISTEN_ON`
    * client-end: `node main.js -c -ip SERVER_IP -p PORT_THE_SERVER_LISTENING_ON`

* Get private and public keys
    * Execute `generateKeys` in `encrypt.js`