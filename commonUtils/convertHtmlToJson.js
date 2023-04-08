

const html5Parser = require('../core/html5Parser');
const fs = require('fs');

if (process.argv.length!==3) {
    console.log('wrong input: ', process.argv);
    return;
}
const html_f_n = process.argv[2];
const htmlStr = fs.readFileSync(html_f_n, {encoding:'utf8', flag:'r'});
console.log(htmlStr);
const json = html5Parser(htmlStr);
fs.writeFileSync(html_f_n+'.json', JSON.stringify(json));