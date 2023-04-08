function _typeof(v) {
    var v_t = typeof v;
    v_t = Array.isArray(v) ? 'array' : (v_t === 'object' ? 'json' : v_t);
    return v_t;
}

function insertTab(num) {
    var str = '';
    for (let i = 0; i < num; i++) {
        str += '\t';
    }
    return str;
}

function buildKeyValueText(k, v, level) {
    const tab_str = insertTab(level);
    var text = tab_str;
    var v_t = _typeof(v);
    if (v_t === 'number' || v_t === 'boolean') {
        text += `{ "${k}": ${v} }`
    }
    else if (v_t === 'string') {
        if( /[\n\r]+/g.test(v) ) {
            text += `{ "${k}": \`${v}\` }`
            console.log('-----------------------: ', text);
        }
        else if ( /"/g.test(v) ){
            text += `{ "${k}": \`${v}\` }`
            console.log('-----------------------: ', text);
        }
        else {
            text += `{ "${k}": "${v}" }`
        }
    }
    else if (v_t === 'function') {
        text += `{ "${k}": ${v.toString()} \n${tab_str}}`
    }
    else if (v_t === 'json') {
        level++
        text += `{ "${k}": ${formatJsonObj(v, level)} \n${tab_str}}`
    }
    else if (v_t === 'array') {
        // const arr_tab_str = insertTab(level);
        level++;
        text += `{ "${k}": [\n ${formatJsonArray(v, level)} \n${tab_str}]}`
    }
    return text;
}


function formatJsonObj(obj, level) {
    var text = '';
    const k_arr = Object.keys(obj);
    const len = k_arr.length;
    for (let i = 0; i < len; i++) {
        const k = k_arr[i];
        const v = obj[k];
        text += buildKeyValueText(k, v, level);
        if (i!=len-1) {
            text += ',\n'
        }
    }
    return text;
}

function formatJsonArray(objArr, level) {
    var text = '';
    const len = objArr.length;
    for (let i = 0; i < objArr.length; i++) {
        const obj = objArr[i];
        text += formatJsonObj(obj, level);
        if (i!=len-1) {
            text += ',\n'
        }
    }
    return text;
}

module.exports = (obj) => {
    const v_t = _typeof(obj);
    var text = '';
    if (v_t==='array') {
        text = formatJsonArray(obj, 0, '');
    }
    else if (v_t==='json') {
        text = formatJsonObj(obj, 0, '');
    }
    return text;
}