const typeOf = require('./commonUtils/types');
function jsonArrayTemplate(options = {div: [], methods: {}, eventHandlers: {}, defaultDataArr: []},) {
    if (typeOf(options) !== 'json') {
        return false;
    }
    const key_arr = Object.keys(options);
    const dom_name = key_arr.filter((item) => { 
        return item !== 'methods' && item !== 'eventHandlers' && item !== 'defaultDataArr'
    })

    this.domTemplate = {};
    this.tagName = dom_name;
    this.domTemplate[dom_name] = options[dom_name];

    this.methods = typeOf(options.methods)==='json'? options.methods : undefined;
    this.eventHandlers = typeOf(options.eventHandlers)==='json'? options.eventHandlers : undefined;

    this.bindInfoList = {}; // = {path1:[bindKey1, bindKey2], path2:[bindKey1, bindKey2]}
    // jsonArrayTemplate.buildBindInfoList(this.tagName, this.domTemplate, '', this.bindInfoList);
    jsonArrayTemplate.buildBindInfoList(this.tagName, this.domTemplate, '0', this.bindInfoList);
    console.log(this.bindInfoList);
}

module.exports = jsonArrayTemplate;

// jsonArrayTemplate.getSubTagArr = function (template) {}

jsonArrayTemplate.buildBindInfoList = function (tagName, domTemplate, path, bindInfoList) {

    const tag_n = tagName;
    // path = path + '/' + tag_n;

    const dom_v = domTemplate[tag_n];
    const dom_v_t = typeOf(dom_v);

    function getBindKeyArr(str) {
        if (typeof str!=='string') {
            return;
        }
        const reg = /{{[a-zA-Z]+[0-9]*}}/g;  // <<kkkks.a<< || {{ddd}}
        const m_arr = str.match(reg);
        const b_k_arr = [];
        if (m_arr && m_arr.length!==0) {
            for (const m_str of m_arr) {
                b_k_arr.push( m_str.substring(2, m_str.length-2) );
            }
            return b_k_arr;
        }
        else return null;
    }

    if (dom_v_t === 'string') { // attributes
        const arr = getBindKeyArr(dom_v);
        if (arr && arr.length!==0) {
            bindInfoList[path] = arr;
        }
    }
    // else if (dom_v_t === 'function') {  // script tag
    //     if (/^(script)(\$[0-9]+)?$/.test(tag_n) === false) {
    //         return null;
    //     }
    // }
    else if (dom_v instanceof jsonArrayComponent) { // component
        if (dom_v.jArrData.bindKey) {
            bindInfoList[path] = [dom_v.jArrData.bindKey];
        }
    }
    else if (dom_v_t === 'array') { // attributes, innerText or children
        const sub_dom_arr = dom_v;
        for (let i = 0; i < sub_dom_arr.length; i++) {
            const sub_dom_obj = sub_dom_arr[i];
            var sub_path = path;

            const sub_tag_n = Object.keys(sub_dom_obj)[0];
            // sub_path += '/' + sub_tag_n;
            sub_path += '/' + i;
            const sub_dom_v = sub_dom_obj[sub_tag_n];

            if (sub_dom_v instanceof jsonArrayComponent) {
                if (sub_dom_v.jArrData.bindKey) {
                    bindInfoList[sub_path] = [sub_dom_v.jArrData.bindKey];
                }
                continue;
            }

            const sub_dom_v_t = typeOf(sub_dom_v);
            if (sub_tag_n.indexOf('$') === 0) { // attributes
                if (sub_dom_v_t==='json' && sub_tag_n==='$style') {
                    const arr = getBindKeyArr( JSON.stringify(sub_dom_v) );
                    if (arr && arr.length!==0) {
                        bindInfoList[sub_path] = arr;
                    }
                }
                else if ( (sub_tag_n==='$data' || sub_tag_n.substring(0, 3) === '$on') && sub_dom_v_t==='function' ) {
                    
                }
                else if (sub_dom_v_t==='json' && sub_tag_n==='$subscription') {
                    
                }
                else {
                    const arr = getBindKeyArr(sub_dom_v);
                    if (arr && arr.length!==0) {
                        bindInfoList[sub_path] = arr;
                    }
                }
            }
            else { // children
                if (sub_dom_v_t === 'array') {
                    jsonArrayTemplate.buildBindInfoList(sub_tag_n, sub_dom_obj, sub_path, bindInfoList);
                }
                else if (sub_dom_v_t==='string') { // attributes of children
                    const arr = getBindKeyArr(sub_dom_v);
                    if (arr && arr.length!==0) {
                        bindInfoList[sub_path] = arr;
                    }
                }
            }
        }
    }
}

jsonArrayTemplate.getValueByKeyPath = function (domTemplate, path) { // domTemplate = {kkk: []}

    if (path === '/') {
        return domTemplate;//this.domTemplate;
    }
    // const tag_n = Object.keys(this.domTemplate)[0];
    const tag_n = Object.keys(domTemplate)[0];
    if (path === '/' + tag_n) {
        return domTemplate; //this.domTemplate;
    }
    if (typeof path !== 'string' || path.charAt(0) !== '/' || path.charAt(path.length - 1) === '/') {
        console.log('path format error!');
        return null;
    }
    const path_key_arr = path.split('/');
    var p_key_counter = 0;
    var target_obj = null;

    var obj_arr = value = domTemplate[tag_n]; //this.domTemplate[tag_n];
    if (path_key_arr.length >= 3 && typeOf(value) !== 'array') {
        console.log('when number of sub path names exceeds 2, value of object should type of array!');
        return null;
    }

    for (let i = 2; i < path_key_arr.length; i++) { // 遍历到倒数第二级
        const p_key = path_key_arr[i];
        if (!Array.isArray(obj_arr)) {
            console.log('not array!!');
            return null;
        }
        for (const obj of obj_arr) {
            const o_key = Object.keys(obj)[0];
            if (p_key === o_key) {
                console.log(o_key);
                obj_arr = obj[o_key];
                target_obj = obj;
                p_key_counter++;
                break;
            }
        }
    }

    if (p_key_counter !== path_key_arr.length - 2) {
        console.log('cannot find the value by: ', path);
        return null;
    }
    // return obj_arr;
    return target_obj;
}

jsonArrayTemplate.prototype.execOperation = function (path, operation, value) {

    if (typeof path !== 'string' ||
        path.charAt(0) !== '/' ||
        (operation !== 'insertBefore' && operation !== 'insertAfter' && operation !== 'del' && operation !== 'update')
    ) {
        return false;
    }

    const pos = path.lastIndexOf('/');
    const target_parent_path = path.substring(0, pos);
    const target_parent_obj_arr = jsonArrayTemplate.getValueByKeyPath(this.domTemplate , target_parent_path);  //this.getValueByKeyPath(target_parent_path);
    if (!Array.isArray(target_parent_obj_arr)) {
        console.log('not array!!');
        return false;
    }

    const last_p_key = path.substring(pos + 1);
    var is_success = false;
    console.log(last_p_key);
    for (let i = 0; i < target_parent_obj_arr.length; i++) {
        const obj = target_parent_obj_arr[i];
        const o_key = Object.keys(obj)[0];
        if (last_p_key === o_key) {
            is_success = true;
            if (operation === 'insertBefore') {
                target_parent_obj_arr.splice(i, 0, value); // insert before ith item
            }
            else if (operation === 'insertAfter') {
                target_parent_obj_arr.splice(i + 1, 0, value); // insert after ith item
            }
            else if (operation === 'update') {
                target_parent_obj_arr[i] = value;
            }
            else if (operation === 'del') {
                target_parent_obj_arr.splice(i, 1); // insert after ith item
            }
            break;
        }
    }

    return is_success;
}

jsonArrayTemplate.prototype.insertBefore = function (path, value) {
    return this.execOperation(path, 'insertBefore', value);
}

jsonArrayTemplate.prototype.insertAfter = function (path, value) {
    return this.execOperation(path, 'insertAfter', value);
}

jsonArrayTemplate.prototype.delete = function (path) {
    return this.execOperation(path, 'del');
}

jsonArrayTemplate.prototype.update = function (path, value) {
    return this.execOperation(path, 'update', value);
}

const jsonArrayComponent = require('./jsonArrayComponent');
