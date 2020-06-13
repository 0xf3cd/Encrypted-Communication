# Encrypted-Communication
Use Node.js to build a encrypted server-client communication example

* TODO
    * if the input is too long, there would be an error saying `SyntaxError: Unexpected end of JSON input`
    * the data is now sent as the form of 'hex', but there is a lot of redundant information, which can be optimized

* How to run
    * `npm install` to install required packages
    * server-end: `node main.js -s -p PORT_TO_LISTEN_ON`
    * client-end: `node main.js -c -ip SERVER_IP -p PORT_THE_SERVER_LISTENING_ON`

* Get private and public keys
    * Execute `generateKeys` in `encrypt.js`