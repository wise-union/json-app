const HTMLParser = (require('./htmlparser-node')).HTMLParser;
const fs = require('fs');
const jsonFomat = require('./jsonFomat');

module.exports = ({
    htmlText,
    inputFile,
    outputFile
}) => {
    var results = {};
    var parentTagObj;
    var curTagValueArr;
    var filoObjArr = []; // first in last out array
    var isEndOfTag = true;
    var html_content = htmlText;

    if (!htmlText) {
        if (inputFile && fs.existsSync(inputFile)) {
            html_content = fs.readFileSync(inputFile).toString();
        }
        else {
            console.log('no valid input!');
            return null;
        }
    }

    function start(tag, attrs, unary) {
        var tag_obj;
        isEndOfTag = false;
        if (filoObjArr.length === 0) {
            tag_obj = results;
            tag_obj[tag] = [];
            filoObjArr.push(tag_obj);
            curTagValueArr = tag_obj[tag];
        }
        else {
            tag_obj = {};
            tag_obj[tag] = [];
            filoObjArr.push(tag_obj);
            curTagValueArr.push(tag_obj);
            curTagValueArr = tag_obj[tag];
        }

        for (var i = 0; i < attrs.length; i++) {
            const attr_obj = {};
            const attr = attrs[i];
            attr_obj['$' + attr.name] = attr.value;
            curTagValueArr.push(attr_obj);
        }

        if (unary) {
            console.log();
            end(tag);
        }
    }

    function end(tag) {
        filoObjArr.pop();
        const last_index = filoObjArr.length - 1;
        if (last_index < 0) {
            return;
        }
        const obj = filoObjArr[last_index];
        curTagValueArr = Object.values(obj)[0];
        isEndOfTag = true;
    }


    HTMLParser(html_content, {
        start: start,
        end: end,
        chars: function (text) {
            // console.log(text);
            if (isEndOfTag) { //&& (text==='\n' || !curTagValueArr || /^\x20+$/g.test(text) ) ) {
                return;
            }
            if (text === '' || /^[\n\t\r\x20]+$/g.test(text) || !curTagValueArr || /^\x20+$/g.test(text)) {
                return;
            }
            if ( /[\n\r]+/.test(text) ) {
                console.log(text);
            }
            // text = text.replace(new RegExp('"', 'g'), '\\"');
            // console.log(text);
            curTagValueArr.push({ $innerText: text });
        },
        comment: function (text) {
            // console.log(text);
        }
    });

    console.log(results);
    if (outputFile) {
        // 自定义输出格式
        const json_text = 'module.exports = \n' + jsonFomat(results);        
        fs.writeFileSync(outputFile, json_text);
    }

    return results;
};