// v1.1

const jArrEle = require('./jsonArrayElement');
const jArrData = require('./jsonArrayData');
const jsonArrayComponent = require('./jsonArrayComponent');

const _typeof = require('./commonUtils/types');
const findValueByKey = require('./commonUtils/findValueByKey');

// function slot(bindKey) {
//     this.bindKey = bindKey;
// }
// slot.prototype.getBindKey = () => {
//     return this.bindKey;
// }
// slot.prototype.getSlotDom = (bindData) => {
//     const self = this;
//     return findValueByKey(bindData, self.bindKey);
// }
class slot{
    constructor(bindKey){
        this.bindKey = bindKey.replace('{{', '').replace('}}', '');
    }
    getSlotDom(bindData, bindKeyPrefix, bindData_for) {
        const self = this;
        if (bindKeyPrefix && bindData_for) {
            var prefix_str = bindKeyPrefix + '.';
            const pos = this.bindKey.indexOf(prefix_str);
            if (pos===0) {
                const b_key = self.bindKey.replace(prefix_str, '');
                return findValueByKey(bindData_for, b_key);
            }
        }
        return findValueByKey(bindData, self.bindKey);
    }
}

function jsonArrayCompiler() {
    // this.bindData = null;
    // this.bindMethods = null;
    // this.eventHandlers = null;
}

module.exports = jsonArrayCompiler;

jsonArrayCompiler.parseAttr = function (attrObj) {
    const type = _typeof(attrObj);
    if (type === 'string') return attrObj;
    else if (type === 'json') {
        var attr_str = '';
        for (const k in attrObj) {
            if (Object.hasOwnProperty.call(attrObj, k)) {
                var v = attrObj[k];
                v = v ? `="${v}"` : '';
                attr_str += `${k}${v}${SPACE}`;
            }
        }
        return attr_str;
    }
}

jsonArrayCompiler.convertAttrStrToJson = function (str) {
    var attParts = str.split(/\s+/)
    var attSpaces = str.match(/\s+/gm)
    var attrs = {}
    var openAttr

    attParts.forEach(function (item, index) {
        if (!item) return
        if (openAttr) {
            var space = attSpaces[index - 1]
            item = openAttr.open + space + item
            if (openAttr.close.test(item)) {
                openAttr = null
                var attMatches = item.match(/^([^\s\=]+?)\=['"]([\s\S]*)['"]$/m)
                return attrs[attMatches[1]] = attMatches[2]
            } else {
                return openAttr.open = item
            }
        }

        var quotes = item.match(/^([^\s\=]*?)\=('|")([\s\S]*)$/m)
        if (quotes) {
            var reg
            switch (quotes[2]) {
                case '"':
                    reg = /"$/
                    break
                case "'":
                    reg = /'$/
                    break
            }
            if (reg.test(item) && !/^[^\s\=]*?\=['"]$/m.test(item))
                return attrs[quotes[1]] = quotes[3].replace(reg, '')
            else {
                return openAttr = {
                    open: item,
                    close: reg
                }
            }
        }
        var withoutQuotes = item.match(/^([^\s\=]*?)\=([\s\S]*?)$/m)
        if (withoutQuotes) {
            return attrs[withoutQuotes[1]] = withoutQuotes[2] || ''
        }
        // key only attribute
        return attrs[item.split('=')[0]] = ''
    })
    if (openAttr) {
        console.warn('Unclose attribute: ' + openAttr.open)
    }
    return attrs
}

jsonArrayCompiler.parseFunc = function (func) {
    const str = func.toString();
    const pos1 = str.indexOf('{') + 1;
    const pos2 = str.lastIndexOf('}');
    return str.substring(pos1, pos2);
}


const subscription_attr_reg = /^<<[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*<</; // /^>>[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*\]$/;
jsonArrayCompiler.parseStyle = function (styleObj) {
    const type = _typeof(styleObj);
    const result = {keyWithSubValueArr:[]};
    if (type === 'string') return styleObj; //`${SPACE}style="${styleObj}"`;
    else if (type === 'json') {
        var style_str = '';
        for (const k in styleObj) {
            if (Object.hasOwnProperty.call(styleObj, k)) {
                var v = styleObj[k];
                if (subscription_attr_reg.test(v)) {
                    result.keyWithSubValueArr.push(k);
                    continue;
                }
                v = v ? `${v}` : '';
                style_str += `${k}:${v};`;
            }
        }
        // return style_str; //`${SPACE}style="${style_str}"`;
        result.styleStr = style_str;
        return result;
    }
}

jsonArrayCompiler.parseAndSetAttributes = function (ele, attrStr) {
    const attr_obj = jsonArrayCompiler.convertAttrStrToJson(attrStr);
    for (const attr_n in attr_obj) {
        const attr_v = attr_obj[attr_n];
        ele.setAttribute(attr_n, attr_v);
    }
}

jsonArrayCompiler.bindData = function ({
    templateStr,
    data,
    prefix,
    data_for
    // bindDataMappingList = null,
    // path = null
} = {}) {

    var bind_result;
    var is_string_result = false;
    var is_error = false;
    var found_counter = 0;

    function bind(dataUsed, prefix) { // 在dataUsed中遍历所有的key，看这些key是否在templateStr有匹配的字符串
        const d_k_arr = Object.keys(dataUsed);
        for (let i = 0; i < d_k_arr.length; i++) {
            const k = d_k_arr[i];
            const reg_str = prefix? `${prefix}.{{${k}}}` : `{{${k}}}`;
            const reg = new RegExp(reg_str, 'g');
            const is_target_found = reg.test(templateStr);
            if (is_target_found) { // key在templateStr有匹配的字符串
                const v = dataUsed[k];
                const v_t = _typeof(v);
                found_counter++;

                if (v_t==='string') { // 如果是string类型，需要继续循环查找是否还有别的需要bind的地方（templateStr中可以包含多个bind-key）
                    templateStr = templateStr.replace(reg, v); // 将templateStr中绑定了key的地方换成对应的value
                    is_string_result = true;
                }
                else { // v_t 为function或者其他非string类型，直接返回
                    if (is_string_result) { // 既有string类型结果，又有非string类型结果，有问题
                        console.log('既有string类型结果, 又有非string类型结果: ', dataUsed);
                        throw('既有string类型结果, 又有非string类型结果, 请检查BindData');
                    }
                    if (v_t==='json') {
                        console.log('bind-key对应的值为json, 暂时无法处理!');
                    }
                    else if (v_t==='function') {
                        bind_result = v;
                    }
                    return;
                }
                // if (bindDataMappingList) {
                //     if (!bindDataMappingList[k]) bindDataMappingList[k] = [];
                //     bindDataMappingList[k].push(path);
                // }
            }
        }
    }

    if (prefix && data_for) {
        bind(data_for, prefix);
    }
    
    bind(data);

    return found_counter===0? templateStr : (bind_result? bind_result : templateStr);
}

jsonArrayCompiler.bindTopicToEleAttr = function ({
    topic, // <<topic.dataKey<<
    dataKey,
    ele,
    attr
} = {}) {
    const sub_func = jsonArrayComponent.subscribe.bind(ele);
    sub_func(topic, function (msg, data) {// PubSub.subscribe(topic, function (msg, data) {
        if (!data || !data[dataKey]) {
            return;
        }
        if (attr==='innerText') {
            ele.appendChild( jArrEle.createTextNode(data[dataKey]) );
        }
        else {
            ele.setAttribute(attr, data[dataKey]);
        }
    })
}

jsonArrayCompiler.bindTopicToEleStyle = function ({
    topic, // <<topic.dataKey<<
    dataKey,
    ele,
    styleName
} = {}) {
    const sub_func = jsonArrayComponent.subscribe.bind(ele);
    sub_func(topic, function (msg, data) {// PubSub.subscribe(topic, function (msg, data) {
        if (!data || !data[dataKey]) {
            return;
        }
        ele.style[styleName] = data[dataKey];
    })
}

jsonArrayCompiler.getElementType = function (jsonArr) {
    for (const item of jsonArr) {
        const key = Object.keys(item)[0];
        if (key==='$eleType') {
            return item[key];
        }
    }
    return 'normal';
}

jsonArrayCompiler.getForAttr = function (jsonArr) {
    for (const item of jsonArr) {
        const key = Object.keys(item)[0];
        if (key==='$for') {
            return item[key];
        }
    }
    return null;
}

jsonArrayCompiler.getSubTagArr = function (jsonArr) {
    const s_tag_arr = [];
    for (const item of jsonArr) {
        const key = Object.keys(item)[0];
        s_tag_arr.push(key);
    }
    return s_tag_arr;
}

jsonArrayCompiler.splitIntoAttrAndSubDom = function (jsonArr) {
    const s_dom_arr = [];
    const attr_arr = [];
    for (const item of jsonArr) {
        const key = Object.keys(item)[0];
        if (key.charAt(0)!=='$') {
            s_dom_arr.push(item);
        }
        else{
            if (key==='$slot') {
                s_dom_arr.push( new slot(item[key]) );
            }
            else {
                attr_arr.push(item);
            }
        }
    }
    return {
        subDomArr: s_dom_arr, 
        attrNodeArr: attr_arr
    };
}

jsonArrayCompiler.checkIsSubTagExist = function (subTagName, jsonArr) {
    for (const item of jsonArr) {
        const key = Object.keys(item)[0];
        if (subTagName===key) {
            return true;
        }
    }
    return false;
}

jsonArrayCompiler.isVueModelAttr = function (attrName) {
    const opt_map = {
        $el: true,
        $data: true,
        $computed: true,
        $methods: true,
        $watch: true,
        $components: true,
    }
    return opt_map[attrName];
}

jsonArrayCompiler.createVueModelForEle = function (ele, vueEleJsonArrDom) {
    const vue_opts = {};
    var is_el_key_exist = false;
    for (const item of vueEleJsonArrDom) {
        const key = Object.keys(item)[0];
        if (jsonArrayCompiler.isVueModelAttr(key)) {
            const vue_k = key.substring(1);
            if (vue_k==='el') {
                is_el_key_exist = true;
            }
            vue_opts[vue_k] = item[key];
        }
    }
    if (!is_el_key_exist) vue_opts['el'] = ele;

    // var Ctor = Vue.extend(vue_opts);
    // new Ctor().$mount(ele)
    const vm = new Vue(vue_opts);
    // jsonArrayCompiler.processVueAttr.vueEleArr.push(ele);
}

jsonArrayCompiler.parseTemplate = function ({
    template, // = {},
    methods, // = {},
    eventHandlers, // = {},
    bindData, // = null,//{}, 
    bindData_for,
    bindKeyPrefix,
    isSubDom = false, 
    path = '',
    useEle = null,
    isToParseSubComponents = true,
    rootComponent,
    ignoreAttrArr=[],
}={}) {
    const this_compiler = this;
    // console.trace();

    const j_dom_t = _typeof(template);
    if (j_dom_t !== 'json') {
        return null;
    }
    const tag_n = Object.keys(template)[0];
    const ele = useEle? useEle : jArrEle.createElement({
        tagName: tag_n,
        methods: methods,
        eventHandlers: eventHandlers
    })

    const ele_type = jsonArrayCompiler.getElementType(template[tag_n]);

    if (bindData) {
        ele.bindData = bindData;
    }

    if (isSubDom === false) {
        path = path + '/' + tag_n;
    }

    var value = template[tag_n];
    var value_t = _typeof(value);
    if (value_t==='function') {
        const ignore_tag_n_arr = ['script'];
        if (!ignore_tag_n_arr.includes(tag_n)) { // 不是script标签，进行函数调用预处理
            const process_func = value;
            value = process_func.call(ele);
            value_t = _typeof(value);
        }
    }

    if (value_t === 'string') { // attributes，value按属性处理
        var binded_v;
        if (bindData) {
            binded_v = jsonArrayCompiler.bindData({
                templateStr: value,
                data: bindData,
                data_for: bindData_for,
                prefix: bindKeyPrefix
            })
        }
        else {
            binded_v = value;
        }
        jsonArrayCompiler.parseAndSetAttributes(ele, binded_v);
        return ele;
    }
    else if (value_t === 'function') {  // script标签，取function内的字符串内容
        if (/^(script)(\$[0-9]+)?$/.test(tag_n) === false) {
            return null;
        }

        // the following is still needed?
        var binded_v;
        if (bindData) {
            binded_v = jsonArrayCompiler.bindData({
                templateStr: jsonArrayCompiler.parseFunc(value),
                data: bindData,
                data_for: bindData_for,
                prefix: bindKeyPrefix
            })
        }
        else {
            binded_v = jsonArrayCompiler.parseFunc(value);
        }
        ele.innerText = binded_v;
        return ele;
    }
    else if (value instanceof jsonArrayComponent) { // component，按jsonArray组件处理
        if (!value.jArrData.dataArr && value.jArrData.bindKey) {
            value.jArrData.dataArr = bindData[value.jArrData.bindKey];
        }
        var ele_arr = value.compile();
        return ele_arr;
    }
    else if (value_t === 'array') { // attributes属性（含指令）, innerText or children子节点
        // const sub_ele_arr = [];
        var is_sub_dom_processed = false;
        var is_exist = true;
        const {attrNodeArr, subDomArr} = jsonArrayCompiler.splitIntoAttrAndSubDom(value); // 分离attr属性节点（含指令），及子DOM节点

        processAttrArr(attrNodeArr); // 处理attr属性（含指令）

        if (!is_exist) {
            return null;
        }

        if (!is_sub_dom_processed) { // 处理子DOM节点
            for (let i = 0; i < subDomArr.length; i++) {
                const sub_dom = subDomArr[i];
                processSubDom(sub_dom, bindData, bindKeyPrefix, bindData_for);
            }
        }

        function processAttrArr(attrNodeArr) {
            for (let i = 0; i < attrNodeArr.length; i++) {
                const attr_node = attrNodeArr[i];
                const attr_k = Object.keys(attr_node)[0];
                if (ignoreAttrArr.includes(attr_k)) { // 如果是【待忽略属性节点】，不进行处理
                    continue;
                }
                if (ele_type==='vue') {
                    if( jsonArrayCompiler.isVueModelAttr(attr_k)) { // 如果是VUE属性节点，不进行处理
                        continue;
                    }
                }

                var attr_v = attr_node[attr_k];
                var attr_v_t = _typeof(attr_v);
                if (attr_v_t==='function') {
                    // const ignore_attr_k_arr = ['$on'];
                    if (attr_k.substring(0, 3) !== '$on') { // not an event handler，如果不是【事件处理函数】，则进行函数预处理
                        const process_func = attr_v;
                        attr_v = process_func.call(ele);
                        attr_v_t = _typeof(attr_v);
                    }
                }

                const publish_reg = /^\[[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*>>$/;
                const subscription_attr_reg = /^<<[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*<</;  //  /^<<[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*<<$/; // /^>>[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*\]$/;
                const subscription_data_reg = /^>>[a-zA-Z]+[0-9]*\]$/;
                const attr_n = attr_k.substring(1, attr_k.length);

                if ( (attr_n === 'onchange' || attr_n === 'oninput') && publish_reg.test(attr_v) ) { // [kkkks.a>> 属性发布
                    const dot_pos = attr_v.indexOf('.');
                    const topic = attr_v.substring(1, dot_pos);
                    const d_key = attr_v.substring(dot_pos+1, attr_v.length-2);
                    function publish() {
                        const data = {};
                        data[d_key] = this.value;
                        PubSub.publish(topic, data);
                    }
                    const event_n = attr_n.substring(2);
                    ele.addEventListener(event_n, function () {
                        publish.call(ele);
                    })
                }
                else if ( attr_v_t==='string' && attr_v.charAt(0)==='<' && subscription_attr_reg.test(attr_v) ){ // <<kkkks.a<< || {{ddd}} 属性订阅
                    const dot_pos = attr_v.indexOf('.');
                    const d_k_end_pos = attr_v.indexOf('<<', dot_pos);
                    const topic = attr_v.substring(2, dot_pos);
                    const d_key = attr_v.substring(dot_pos+1, d_k_end_pos);
                    jsonArrayCompiler.bindTopicToEleAttr({
                        topic: topic,
                        dataKey: d_key,
                        ele: ele,
                        attr: attr_n
                    });

                    const pos_or = attr_v.indexOf(' || ');
                    var rest_v_str;
                    if (pos_or!==-1) {
                        rest_v_str = attr_v.substring(pos_or+4);
                        var binded_v;
                        if (bindData) {
                            binded_v = jsonArrayCompiler.bindData({
                                templateStr: rest_v_str,
                                data: bindData,
                                data_for: bindData_for,
                                prefix: bindKeyPrefix
                            });
                        }
                        ele.setAttribute(attr_n, binded_v ? binded_v : rest_v_str);
                    }
                }
                else if ( attr_n==='data' && subscription_data_reg.test(attr_v) ) { // >>kkkks]
                    const topic = attr_v.substring(2, attr_v.length-1);
                    if (!ele.data) {
                        ele.data = {};
                    }
                    PubSub.subscribe(topic, function (msg, data) {
                        Object.assign(ele.data, data);
                    })
                }
                else if (attr_k === '$style') {
                    var binded_v;
                    if (attr_v_t === 'json') {
                        const result = jsonArrayCompiler.parseStyle(attr_v);
                        if (result.keyWithSubValueArr.length!==0) { // <<kkkks.a<< || {{ddd}}  // <<kkkks.a<< || grey 1px solid
                            for (let i = 0; i < result.keyWithSubValueArr.length; i++) {
                                const k = result.keyWithSubValueArr[i];
                                const v = attr_v[k];
                                const dot_pos = v.indexOf('.');
                                const d_k_end_pos = v.indexOf('<<', dot_pos);
                                const topic = v.substring(2, dot_pos);
                                const d_key = v.substring(dot_pos+1, d_k_end_pos);  //v.substring(dot_pos+1, v.length-2); //v.substring(dot_pos+1, v.length-1);
                                
                                jsonArrayCompiler.bindTopicToEleStyle({
                                    topic: topic,
                                    dataKey: d_key,
                                    ele: ele,
                                    styleName: k
                                });

                                const pos_or = v.indexOf(' || ');
                                var rest_v_str;
                                if (pos_or!==-1) {
                                    rest_v_str = v.substring(pos_or+4);
                                    result.styleStr += `${k}:${rest_v_str};`;
                                }
                            }
                        }
                        binded_v = result.styleStr;
                    } else if (attr_v_t === 'string') {
                        binded_v = attr_v;
                    }

                    if (bindData) {
                        binded_v = jsonArrayCompiler.bindData({
                            templateStr: binded_v,
                            data: bindData,
                            data_for: bindData_for,
                            prefix: bindKeyPrefix
                        });
                    }
                    ele.setAttribute('style', binded_v);
                }
                else if (attr_k === '$innerText') {
                    var binded_v;
                    if (bindData) {
                        binded_v = jsonArrayCompiler.bindData({
                            templateStr: attr_v,
                            data: bindData,
                            data_for: bindData_for,
                            prefix: bindKeyPrefix
                        });
                    }
                    var text_node = jArrEle.createTextNode(binded_v ? binded_v : attr_v);
                    ele.appendChild(text_node);
                }
                // else if ( attr_k==='$data' && attr_v_t==='function' ) {
                // }
                // else if ( attr_k==='$children' && attr_v_t==='json' ) {
                // }
                else if (attr_k.substring(0, 3) === '$on' ) {
                    var handler_func;
                    if (attr_v_t==='function') {
                        handler_func = attr_v.bind(ele);
                    }
                    else if (attr_v_t==='string' && attr_v.indexOf('{{')!==-1) {
                        if (bindData || bindData_for) {
                            const binded_v = jsonArrayCompiler.bindData({
                                templateStr: attr_v,
                                data: bindData,
                                data_for: bindData_for,
                                prefix: bindKeyPrefix
                            });
                            if (binded_v===null || binded_v===attr_v) { // 没有找到任何绑定值，则进行下一个属性的处理
                                continue;
                            }
                            if (_typeof(binded_v)!=='function') {
                                throw('BindData或者on事件定义有问题!');
                            }
                            handler_func = binded_v.bind(ele);
                        }
                    }
                    // const handler_func = attr_v.bind(ele);
                    const handler_n = attr_n; //attr_k.substring(1);
                    const bind_info = {ele: ele, eventHandlers:{}};
                    bind_info.eventHandlers[handler_n] = handler_func;
                    jArrEle.bindEventHandlers(bind_info);
                }
                else if (attr_k === '$subscription' && attr_v_t==='json') {
                    const {topic, callback} = attr_v;
                    const handler_func = callback.bind(ele);
                    PubSub.subscribe(topic, function (msg, data) {
                        handler_func(msg, data);
                    })
                }
                else if (attr_k === '$existIf') {
                    if ( /{{[a-zA-Z]+[0-9]*}}$/.test(attr_v) ){ // '{{XXXXX}}' or 'item.{{XXXXX}}'
                        const bind_k_str = attr_v.match(/{{[a-zA-Z]+[0-9]*}}$/)[0];  // '{{XXXXX}}'
                        const bind_k = bind_k_str.substring(2, bind_k_str.length-2); // 'XXXXX'

                        var data_used = bindData;
                        if (bindKeyPrefix && attr_v.indexOf(bindKeyPrefix)===0 && bindData_for) { // 'item.{{XXXXX}}'
                            data_used = bindData_for;
                        }

                        if (data_used && !data_used.hasOwnProperty(bind_k)) {
                            is_exist = false;
                            return null;
                        }
                    }
                }
                else if (attr_k === '$for' && attr_v_t==='string') {               // 'item of {{itemArr}}'
                    const bind_k_str = attr_v.match(/{{[a-zA-Z]+[0-9]*}}$/)[0];       // '{{itemArr}}'
                    if (bind_k_str){
                        const bind_k = bind_k_str.substring(2, bind_k_str.length-2);  // 'itemArr'
                        const pos_of = attr_v.indexOf('of');
                        const for_item_n = attr_v.substring(0, pos_of).trim();        // bind key prefix
                        if (bindData && bindData.hasOwnProperty(bind_k)) {
                            const v_arr = bindData[bind_k];
                            if (_typeof(v_arr)!=='array') {
                                continue;
                            }
                            for (const v of v_arr) {
                                for (const sub_dom of subDomArr) {
                                    processSubDom(sub_dom, bindData, for_item_n, v);
                                }
                            }
                            // break;
                            is_sub_dom_processed = true;
                        }
                    }
                }
                else if (attr_k === '$recursion') {
                    if ( /{{[a-zA-Z]+[0-9]*}}$/.test(attr_v) ){                           // '{{XXXXX}}' or 'item.{{XXXXX}}'
                        const bind_k_str = attr_v.match(/{{[a-zA-Z]+[0-9]*}}$/)[0];       // '{{XXXXX}}'
                        const bind_k = bind_k_str.substring(2, bind_k_str.length-2);      // 'XXXXX'
                        var data_used = bindData;
                        if (bindKeyPrefix && attr_v.indexOf(bindKeyPrefix)===0 && bindData_for) { // 'item.{{XXXXX}}'
                            data_used = bindData_for;
                        }

                        if (data_used && data_used.hasOwnProperty(bind_k) && rootComponent) {
                            if (!rootComponent.recursionLevelCounter) {
                                rootComponent.recursionLevelCounter = 0;
                            }
                            rootComponent.recursionLevelCounter++;
                            const tmp_sub_ele_arr = rootComponent.compile( data_used[bind_k] );  // bindData_for???
                            for (const s_ele of tmp_sub_ele_arr) {
                                if(s_ele) {
                                    s_ele.recursionLevel = rootComponent.recursionLevelCounter;
                                    ele.appendChild(s_ele);
                                }
                            }
                            rootComponent.eleInfoArr.push({parentEle: ele, eleArr: tmp_sub_ele_arr});
                            rootComponent.recursionLevelCounter--;
                            continue;
                        }
                    }
                }
                else if (attr_k === '$methods' && attr_v_t==='json') {
                    for (const method_k in attr_v) {
                        const method_v = attr_v[method_k];
                        if ( /{{[a-zA-Z]+[0-9]*}}$/.test(method_v) ){ // '{{XXXXX}}' or 'item.{{XXXXX}}'
                            const bind_k_str = method_v.match(/{{[a-zA-Z]+[0-9]*}}$/)[0];  // '{{XXXXX}}'
                            const bind_k = bind_k_str.substring(2, bind_k_str.length-2); // 'XXXXX'
    
                            var data_used = bindData;
                            if (bindKeyPrefix && method_v.indexOf(bindKeyPrefix)===0 && bindData_for) { // 'item.{{XXXXX}}'
                                data_used = bindData_for;
                            }
    
                            if (data_used && data_used.hasOwnProperty(bind_k)) {
                                const func = data_used[bind_k];
                                if (_typeof(func)!=='function') {
                                    continue;
                                }
                                ele.methods[method_k] = func.bind(ele);
                            }
                        }
                    }
                }
                else {
                    var binded_v;
                    if (bindData) {
                        binded_v = jsonArrayCompiler.bindData({
                            templateStr: attr_v,
                            data: bindData,
                            data_for: bindData_for,
                            prefix: bindKeyPrefix
                        });
                    }
                    ele.setAttribute(attr_n, binded_v ? binded_v : attr_v);
                }
            }
        }

        function processSubDom(childDomObj, bindData, bindKeyPrefix, bindData_for) {

            if (childDomObj instanceof slot) {
                const slot_dom_obj = childDomObj.getSlotDom(bindData, bindKeyPrefix, bindData_for);
                if (!slot_dom_obj) {
                    return;
                }
                const slot_dom_t = _typeof(slot_dom_obj);
                if (slot_dom_t==='array') {
                    for (const s_dom of slot_dom_obj) {
                        processSubDom(s_dom, bindData, bindKeyPrefix, bindData_for);
                    }
                }
                else if(slot_dom_t==='json'){
                    processSubDom(slot_dom_obj, bindData, bindKeyPrefix, bindData_for);
                }
                return;
            }

            const sub_dom_obj = childDomObj;
            // var sub_path = path;
            const sub_tag_n = Object.keys(sub_dom_obj)[0];
            // sub_path += '/' + sub_tag_n;
            var sub_dom_v = sub_dom_obj[sub_tag_n];
            var sub_dom_v_t = _typeof(sub_dom_v);
            if (sub_dom_v_t==='function') { // 如果子DOM值类型是函数，且不是script，则进行函数调用预处理
                const ignore_sub_tag_arr = ['script'];
                if (!ignore_sub_tag_arr.includes(sub_tag_n)) {
                    const process_func = sub_dom_v;
                    sub_dom_v = process_func.call(ele);
                    sub_dom_v_t = _typeof(sub_dom_v);
                }
            }

            var sub_ele;

            if (sub_dom_v instanceof jsonArrayComponent) {
                if (!isToParseSubComponents) {
                    return;
                }
                const tmp_sub_ele_arr = sub_dom_v.compile(sub_dom_v.jArrData.bindKey && bindData? bindData[sub_dom_v.jArrData.bindKey] : null);
                for (const s_ele of tmp_sub_ele_arr) {
                    if(s_ele) ele.appendChild(s_ele);
                    if (s_ele.eleType==='vue' && !s_ele.mountVueModel) {
                        s_ele.mountVueModel = jsonArrayCompiler.createVueModelForEle.bind(null, s_ele, s_ele.domTemplate);
                    }
                }
                sub_dom_v.eleInfoArr.push({parentEle: ele, eleArr: tmp_sub_ele_arr});
                return;
            }

            if (sub_dom_v_t === 'array') { // || sub_dom_v_t === 'json'
                sub_ele = jsonArrayCompiler.parseTemplate({
                    template: sub_dom_obj,
                    bindData: bindData,
                    bindData_for: bindData_for,
                    bindKeyPrefix: bindKeyPrefix,
                    rootComponent: rootComponent
                })
            }
            else {
                if (sub_dom_v_t === 'function') { // script
                    if (/^(script)(\$[0-9]+)?$/.test(sub_tag_n) === false) {
                        return null;
                    }
                    const script_str = jsonArrayCompiler.parseFunc(sub_dom_v);
                    var binded_v;
                    if (bindData) {
                        binded_v = jsonArrayCompiler.bindData({
                            templateStr: script_str,
                            data: bindData,
                            data_for: bindData_for,
                            prefix: bindKeyPrefix
                        });
                    }
                    const text_node = jArrEle.createTextNode(binded_v ? binded_v : script_str);
                    sub_ele = jArrEle.createElement({tagName:sub_tag_n});
                    // sub_ele.bindData = bindData;
                    sub_ele.appendChild(text_node);
                }
                else { // attribute string of children
                    sub_ele = jArrEle.createElement({tagName:sub_tag_n});
                    // sub_ele.bindData = bindData;
                    var binded_v;
                    if (bindData) {
                        binded_v = jsonArrayCompiler.bindData({
                            templateStr: sub_dom_v,
                            data: bindData,
                            data_for: bindData_for,
                            prefix: bindKeyPrefix
                        });
                    }
                    jsonArrayCompiler.parseAndSetAttributes(sub_ele, binded_v ? binded_v : sub_dom_v);
                }
            }
            if (sub_ele) {
                ele.appendChild(sub_ele);
                if (sub_ele.eleType==='vue' && !sub_ele.mountVueModel) {
                    sub_ele.mountVueModel = jsonArrayCompiler.createVueModelForEle.bind(null, sub_ele, sub_ele.domTemplate);
                }
            }
        }

        ele.eleType = ele_type;
        ele.domTemplate = template[tag_n];
        
        if (ele.eleType==='vue' && !ele.mountVueModel) {
            ele.mountVueModel = jsonArrayCompiler.createVueModelForEle.bind(null, ele, ele.domTemplate);
        }
        return ele;
    }
}
