// const jArrCompiler = require('./jsonArrayCompiler');
// const jsonArrayTemplate = require('./jsonArrayTemplate');
const jsonArrayElement  = require('./jsonArrayElement');
const jsonArrayData     = require('./jsonArrayData');
const typeOf = require('./commonUtils/types');

function jsonArrayComponent({
    template, // = {div: [], methods: {}, eventHandlers: {}, defaultDataArr: []},
    dataOptions // = {initDataArr: [], subscriptionTopic: ''}
}={}) {
    this.jArrTemplate = new jsonArrayTemplate(template);
    this.jArrTemplate.component = this;
    
    this.jArrData = new jsonArrayData(dataOptions);
    this.jArrData.component = this;

    // this.eleArr = [];
    // this.parentEle = null;
    this.eleInfoArr = []; // [{parentEle: , eleArr: []},{parentEle: , eleArr: []}]
    this.isWaitForInitData = false;
}

module.exports = jsonArrayComponent;

jsonArrayComponent.factory = function (
    template // = {div: [], methods: {}, eventHandlers: {}, defaultDataArr: []}
) {
    return function componentCreator(dataOptions) { // = {initDataArr: [], subscriptionTopic: '', bindKey: ''}) { // dataOptions can be a string
        const obj = new jsonArrayComponent({
            template: template,
            dataOptions: dataOptions
        });
        // options = undefined;
        dataOptions = undefined;
        return obj;
    }
}

jsonArrayComponent.prototype.onDataChange = function ({
    opType, // = 'insertBefore',
    position, // = '0/0',
    dataArr, // = []
}) {
    const pos_arr = position.split('/');
    const pos_parent = Number(pos_arr[0]);
    var pos_child = Number(pos_arr[1]);
    const ele_info = this.eleInfoArr[pos_parent];
    const parent_ele = ele_info.parentEle;
    // const ele_arr = ele_info.eleArr;
    var ele_arr = ele_info.eleArr;
    var ele;

    for (let i = 0; i < dataArr.length; i++) {
        const data = dataArr[i];
        if (opType==='insertBefore' || opType==='insertAfter') {
            // if (this.isWaitForInitData) {
            if (ele_arr[0].isWaitForInitData) {
                // if (pos_child!==0 && i===0) {
                //     console.log('invalid pos_child!');
                //     return false;
                // }
                console.log('6: ', (new Date()).getTime());
                ele = ele_arr[0];
                this.initEleWithData(ele, data);
                console.log('7: ', (new Date()).getTime());
                // this.isWaitForInitData = false;
                ele_arr[0].isWaitForInitData = false;
                pos_child--;
            }
            else {
                ele = this.createEleWithData(data);
                if (!ele) {
                    continue;
                }
                const target_ele = ele_arr[pos_child+i];
                var insert_index;
                if (opType==='insertBefore') {
                    // parent_ele.insertBefore(ele, target_ele);
                    target_ele.before(ele);
                    insert_index = pos_child+i;
                }
                else {
                    if (pos_child+i === ele_arr.length-1) {
                        parent_ele.appendChild(ele);
                    }
                    else {
                        // parent_ele.insertBefore(ele,target_ele.nextSibling);
                        target_ele.after(ele);
                    }
                    insert_index = pos_child+i+1;
                }
                // ele_arr.splice(insert_index, 0, ele);
                ele_info.eleArr = parent_ele.children;
                ele_arr = ele_info.eleArr;
            }
            if (ele.eventHandlers && ele.eventHandlers['onmessage']) ele.eventHandlers['onmessage'](data);
        }
        else if (opType==='update') {
            ele = ele_arr[pos_child+i];
            this.updateEleWithData(ele, data);
        }
        else if (opType==='delete') {
    
        }
    }
}

jsonArrayComponent.prototype.initEleWithData = function (ele, data) {
    jArrCompiler.parseTemplate({
        template: this.jArrTemplate.domTemplate,
        // methods: this.jArrTemplate.methods,
        // eventHandlers: this.jArrTemplate.eventHandlers,
        bindData: data,
        useEle: ele, //this.eleArr[0] // dont create new element
        rootComponent: this
    });
}

jsonArrayComponent.prototype.getSubComponentsHavingBindKey = function () {
    const d_template = this.jArrTemplate.domTemplate;
    const comp_arr = []; 
    for (const k in d_template) {
        if (k.charAt(0)==='$') {
            continue;
        }
        const v = d_template[k];
        if (v instanceof jsonArrayComponent && v.jArrData && v.jArrData.bindKey) {
            comp_arr.push(v);
        }
    }
    return comp_arr;
}

jsonArrayComponent.prototype.getEleInfo = function (ele) {
    const parent_ele = ele.parentElement;
    for (let i = 0; i < this.eleInfoArr.length; i++) {
        const ele_info = this.eleInfoArr[i];
        if (ele_info.parentEle === parent_ele) {
            return ele_info;
        }
    }
}

jsonArrayComponent.prototype.insertSiblingWithData = function (targetEle, data, opType='insertBefore') {
    const ele_info = this.getEleInfo(targetEle);
    const parent_ele = ele_info.parentEle; //targetEle.parentElement;
    const ele_arr = ele_info.eleArr; //parent_ele.children;
    var ele;
    if (ele_arr[0].isWaitForInitData) {
        ele = ele_arr[0];
        this.initEleWithData(ele, data);
        ele_arr[0].isWaitForInitData = false;
    }
    else {
        ele = this.createEleWithData(data);
        if (!ele) {
            return false;
        }
        if (opType==='insertBefore') {
            targetEle.before(ele);
        }
        else if (opType==='insertAfter') {
            target_ele.after(ele);
        }
        // ele_arr.splice(insert_index, 0, ele);
        ele_info.eleArr = parent_ele.children;
    }
    if (ele.eventHandlers && ele.eventHandlers['onmessage']) ele.eventHandlers['onmessage'](data);
}


jsonArrayComponent.prototype.updateEleWithData = function (ele, data) {
    
    const that = this;
    var cur_ele = ele;

    function getDomObj(jDomArr, path) {
        const p_i_arr = path.split('/');
        var dom_obj = jDomArr[ p_i_arr[0] ];
        for (let i = 1; i < p_i_arr.length; i++) {
            var dom_v_arr = Object.values(dom_obj)[0];
            const p_i = p_i_arr[i];
            dom_obj = dom_v_arr[p_i];
        }
        return dom_obj;
    }

    function getChildEle(ele, domTemplate, path) {
        const p_i_arr = path.split('/');
        // var dom_obj = jDomArr[ p_i_arr[0] ];
        var dom_obj = domTemplate;
        // var child_ele = ele.children[ p_i_arr[0] ];
        var child_ele = ele;
        for (let i = 0; i < p_i_arr.length; i++) {
            var p_i = Number(p_i_arr[i]);
            var dom_v_arr = Object.values(dom_obj)[0];
            var attr_counter = 0;
            for (let j = 0; j < p_i; j++) {
                const dom_obj_2 = dom_v_arr[j];
                const dom_k_2 = Object.keys(dom_obj_2)[0];
                if (dom_k_2.charAt(0)==='$') { // need to skip the attribute objects
                    attr_counter++;
                }
            }
            dom_obj = dom_v_arr[p_i];
            const dom_k = Object.keys(dom_obj)[0];
            if (dom_k.charAt(0)!=='$') { // not an attribute, but an element
                child_ele = child_ele.children[ p_i - attr_counter ];
            }
        }
        return child_ele;
    }

    const dom_template_v = Object.values(this.jArrTemplate.domTemplate)[0];
    // const dom_template_v_t = typeOf(dom_template_v);

    const b_info_list = this.jArrTemplate.bindInfoList; // = {path1:[bindKey1, bindKey2], path2:[bindKey1, bindKey2]}  
    for (const path_k in b_info_list) { // path_k = '0/0/1'
        const dom_obj = getDomObj(dom_template_v, path_k.substring(2));
        const dom_k = Object.keys(dom_obj)[0];
        const dom_v = dom_obj[dom_k];
        const b_k_arr = b_info_list[path_k];
        
        cur_ele = getChildEle(ele, this.jArrTemplate.domTemplate, path_k.substring(2));

        for (const b_k of b_k_arr) {
            const b_v = data[b_k];
            const reg = new RegExp('{{' + b_k + '}}', 'g');
            const dom_v_t = typeOf(dom_v);
            if (dom_k.charAt(0)==='$') { // attribute
                if (typeOf(dom_v)==='json' && dom_k==='$style') {
                    
                }
                else if (typeOf(dom_v)==='string' && dom_k!=='$innerText') {
                    var final_v_str = dom_v.replace(reg, b_v);
                    cur_ele.setAttribute(dom_k.substring(1), final_v_str);
                }
            }
            else{ // children
                if (dom_v instanceof jsonArrayComponent && dom_v.jArrData && dom_v.jArrData.bindKey===b_k) {
                    if (typeOf(b_v)==='array') {
                        for (const b_v_data of b_v) {
                            // // const {position, dataArr} = b_v_data;
                            // const pos_arr = b_v_data.position.split('/');
                            // const pos_parent = Number(pos_arr[0]);
                            // const pos_child = Number(pos_arr[1]);
                            // const ele_info = dom_v.eleInfoArr[pos_parent];
                            // // const parent_ele = ele_info.parentEle;
                            // const ele = ele_info.eleArr[pos_child];
                            // cur_ele = getChildEle(ele, this.jArrTemplate.domTemplate, path_k.substring(2));
                            dom_v.updateEleWithData(cur_ele, b_v_data);
                            // dom_v.updateEleWithData(ele, b_v_data.dataArr[0]);
                        }
                    }
                }
                else {
                    // cur_ele = getChildEle(ele, this.jArrTemplate.domTemplate, path_k.substring(2));
                    if (typeOf(dom_v)==='json' && dom_k==='$style') {
                    
                    }
                    else if (typeOf(dom_v)==='string' && dom_k!=='$innerText') {
                        var attr_str = dom_v.replace(reg, b_v);
                        jArrCompiler.parseAndSetAttributes(cur_ele, attr_str);
                    }
                }
            }
        }
    }
}

jsonArrayComponent.prototype.createEleWithData = function (data) {
    const new_ele = jArrCompiler.parseTemplate({
        template: this.jArrTemplate.domTemplate,
        methods: this.jArrTemplate.methods,
        eventHandlers: this.jArrTemplate.eventHandlers,
        bindData: data,
        rootComponent: this
    });
    if (new_ele) {
        new_ele.methods.insertSiblingWithData = this.insertSiblingWithData.bind(this, new_ele);
        new_ele.methods.updateWithData = this.updateEleWithData.bind(this, new_ele);
        new_ele.methods.publish = jsonArrayComponent.publish.bind(new_ele);
        new_ele.methods.subscribe = jsonArrayComponent.subscribe.bind(new_ele);
        new_ele.correspondingComponent = this;
    }
    return new_ele;
}

jsonArrayComponent.prototype.cloneEle = function (ele) {

    function cloneProperties(cloneEle, ele) {
        if (!cloneEle || !ele) {
            console.log('XXXXXXXXXXXXX');
        }
        const key_arr = Object.keys(ele);
        for (const k of key_arr) {
            if (k !== 'methods' && k !== 'eventHandlers') {
                if (!cloneEle || !ele || !ele[k]) {
                    console.log('XXXXXXXXXXXXX');
                }
                cloneEle[k] = ele[k];
            }
        }

        if (ele.children.length!==0 && ele.childNodes.length!==ele.children.length) {
            console.log('YYYYYYYYYYYYYYYYYYYY');
        }

        const attr_arr = ele.attributes;
        for (const attr of attr_arr) {
            if (attr.specified) {
                cloneEle.setAttribute(attr.nodeName, attr.nodeValue);
            }
        }

        function removeAllTextNodes(ele) {
            for (const child_n of ele.childNodes) {
                if (child_n.nodeType===3) {
                    ele.removeChild(child_n);
                }
            }
        }
        removeAllTextNodes(cloneEle);
        for (const node of ele.childNodes) {
            if (node.nodeType===3) {
                console.log('----------------------------');
                var t_node = document.createTextNode(node.nodeValue);
                cloneEle.appendChild(t_node);
            }
        }
        // cloneEle.innerText = ele.innerText;
    }
    function cloneChildren(cloneEle, ele) {
        if (ele.children.length!==0) {
            for (let i = 0; i < ele.children.length; i++) {  // childNodes??
                const child = ele.children[i];
                const clone_child = cloneEle.children[i];
                var new_clone_child;
                if (child.correspondingComponent && child.correspondingComponent instanceof jsonArrayComponent) {
                    if (child.bindData) {
                        new_clone_child = child.correspondingComponent.compile([child.bindData])[0];
                        // clone_child.innerHTML = "";
                    }
                    else {
                        new_clone_child = child.correspondingComponent.compile()[0];
                        // clone_child.innerHTML = "";
                    }
                }
                else {
                    console.log('normal elements: ', child);
                    if (!clone_child) {
                        new_clone_child = child.cloneNode(true);
                    }
                    else new_clone_child = clone_child;
                    // clone_child.innerHTML = "";
                    // if (!child || !new_clone_child || !clone_child) {
                    //     console.log('XXXXXXXXXXXXX');
                    // }
                    // new_clone_child = clone_child;
                    // cloneProperties(new_clone_child, child);
                }
                
                // if (!child || !new_clone_child || !clone_child) {
                //     console.log('XXXXXXXXXXXXX');
                // }
                cloneProperties(new_clone_child, child);
                if (clone_child) {
                    if (new_clone_child!==clone_child) cloneEle.replaceChild(new_clone_child, clone_child);
                }
                else {
                    cloneEle.appendChild(new_clone_child);
                }

                if (child.children.length!==0) {
                    cloneChildren(new_clone_child, child);
                }
            }
        }
    }


    var clone_ele; //= ele.cloneNode(true);
    if (ele.bindData) {
        clone_ele = this.compile([ele.bindData])[0];
    }
    else {
        clone_ele = this.compile()[0];
    }
    cloneProperties(clone_ele, ele);
    // clone_ele.innerHTML = "";
    cloneChildren(clone_ele, ele);
    // this.bindMethodsAndEventHandlersToEle(clone_ele);

    // clone_ele.innerText = ele.innerText;

    return clone_ele;
}

jsonArrayComponent.prototype.bindMethodsAndEventHandlersToEle = function (ele) {
    jsonArrayElement.bindEventHandlers({ele: ele, eventHandlers: this.jArrTemplate.eventHandlers});
    jsonArrayElement.bindMethods({ele: ele, methods: this.jArrTemplate.methods});
}

jsonArrayComponent.prototype.compile = function (dataArr=null) {
    const j_dom = this.jArrTemplate.domTemplate;
    const result = [];
    if (this.jArrData.isBindDataUsed===false && dataArr===null) {
        const ele = jArrCompiler.parseTemplate({
            template: j_dom,
            methods: this.jArrTemplate.methods,
            eventHandlers: this.jArrTemplate.eventHandlers,
            rootComponent: this // used for recursion
        });
        if (ele) {
            ele.methods.insertSiblingWithData = this.insertSiblingWithData.bind(this, ele);
            ele.methods.updateWithData = this.updateEleWithData.bind(this, ele);
            ele.methods.publish = jsonArrayComponent.publish.bind(ele);
            ele.methods.subscribe = jsonArrayComponent.subscribe.bind(ele);
            ele.correspondingComponent = this;
        }
        result.push(ele);
    }
    else {
        if (typeOf(this.jArrData.initDataArr)==='array' && dataArr===null) {
            dataArr = this.jArrData.initDataArr;
        }
        // const data_arr = this.jArrData.dataArr;
        if (typeOf(dataArr)==='array' && dataArr.length>0) {
            for (let i = 0; i < dataArr.length; i++) {
                const data = dataArr[i];
                const ele = jArrCompiler.parseTemplate({
                    template: j_dom,
                    methods: this.jArrTemplate.methods,
                    eventHandlers: this.jArrTemplate.eventHandlers,
                    bindData: data,
                    rootComponent: this
                })
                if (ele) {
                    ele.methods.insertSiblingWithData = this.insertSiblingWithData.bind(this, ele);
                    ele.methods.updateWithData = this.updateEleWithData.bind(this, ele);
                    ele.methods.publish = jsonArrayComponent.publish.bind(ele);
                    ele.methods.subscribe = jsonArrayComponent.subscribe.bind(ele);
                    ele.correspondingComponent = this;
                }
                result.push(ele);
            }
            this.jArrData.initDataArr = undefined;
        }
        else if (this.jArrData.subToken) { // data is not ready and waiting for publishing
            if (!this.parentEle) {
                console.log('errors may occur!');
            }
            const tag_n = Object.keys(this.jArrTemplate.domTemplate)[0];
            const ele = jsonArrayElement.createElement({
                tagName: tag_n, //'jsonArrayComponent'
                methods: this.jArrTemplate.methods,
                eventHandlers: this.jArrTemplate.eventHandlers
            });

            if (ele) {
                ele.methods.initWithData = this.initEleWithData.bind(this, ele);
                ele.methods.insertSiblingWithData = this.insertSiblingWithData.bind(this, ele);
                ele.methods.updateWithData = this.updateEleWithData.bind(this, ele);
                ele.methods.publish = jsonArrayComponent.publish.bind(ele);
                ele.methods.subscribe = jsonArrayComponent.subscribe.bind(ele);
                ele.correspondingComponent = this;
                
                // if (this.jArrTemplate.methods) {
                //     console.log('bind mehtods: ', this.jArrTemplate.methods);
                //     jsonArrayElement.bindMethods({ele: ele, methods: this.jArrTemplate.methods});
                // }
                // if (this.jArrTemplate.eventHandlers) {
                //     console.log('bind eventHandlers: ', this.jArrTemplate.eventHandlers);
                //     jsonArrayElement.bindEventHandlers({ele: ele, eventHandlers: this.jArrTemplate.eventHandlers});
                // }

                // ele.setAttribute('id', (new Date()).getTime());
                // ele.setAttribute('is-wait-for-init-data', true);
                // ele.isWaitForInitData = true;
                this.isWaitForInitData = true;
                ele.isWaitForInitData = true;
            }

            result.push(ele);
        }
    }

    // this.eleArr = result;
    return result;
}

jsonArrayComponent.prototype.removeAllElements = function () {
    for (let i = 0; i < this.eleInfoArr.length; i++) {
        const ele_info = this.eleInfoArr[i];
        for (let j = 0; j < ele_info.eleArr.length; j++) {
            const ele =  ele_info.eleArr[j];
            ele.remove();
        }
        // this.eleInfoArr[i].eleArr = null;
        // this.eleInfoArr[i].parentEle = null;
    }
    this.eleInfoArr = [];
}

// jsonArrayComponent.prototype.appendChild(parentEle, childEle) {
//     if (childEle.eleType && childEle.eleType==='vue') {
//         jsonArrayCompiler.createVueModelForEle(childEle, Object.values(this.jArrTemplate.domTemplate) );
//     }
// }
// jsonArrayComponent.prototype.mountToVueModel = function(targetEle) {
//         jsonArrayCompiler.createVueModelForEle(targetEle, Object.values(this.jArrTemplate.domTemplate) );
// }

jsonArrayComponent.publish = jsonArrayData.publish;
jsonArrayComponent.subscribe = jsonArrayData.subscribe;

const jArrCompiler = require('./jsonArrayCompiler');
const jsonArrayTemplate = require('./jsonArrayTemplate');