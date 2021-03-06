// Make output colorful
const addColor = (str, color='no') => {
    const colorConfig = {
        'green': '\033[32m',
        'g': '\033[32m',
        'yellow': '\033[33m',
        'y': '\033[33m',
        'red': '\033[31m',
        'r': '\033[31m',
    };

    if(color == 'no') {
        return str;
    }

    color = colorConfig.hasOwnProperty(color)? color : 'green';
    const startChar = colorConfig[color];
    const endChar = '\033[0m';

    return `${startChar}${str}${endChar}`;
};

const print = (str, color='no') => {
   process.stdout.write(addColor(str, color));
};

const printSys = (str) => {
    console.log(str);
};

module.exports = {
    addColor,
    print,
    printSys
};