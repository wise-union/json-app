// const typeOf = require('../commonUtils/types');
var globalDocument = null;
var globalWindow = null;
if (typeof window === 'undefined') {
    // const jsdom = require("jsdom");
    // const JSDOM = jsdom.JSDOM;
    // globalWindow = new JSDOM('').window;
    // globalDocument = globalWindow.document;
}
else {
    globalDocument = document;
    globalWindow = window;
    globalDocument.whenReady = (function () { //这个函数返回whenReady()函数
        var funcs = [
        ]; //当获得事件时，要运行的函数
        var ready = false; //当触发事件处理程序时,切换为true
        //当文档就绪时,调用事件处理程序
        function handler(e) {
            if (ready)
                return; //确保事件处理程序只完整运行一次
            //如果发生onreadystatechange事件，但其状态不是complete的话,那么文档尚未准备好
            if (e.type === 'onreadystatechange' && globalDocument.readyState !== 'complete') {
                return;
            }
            //运行所有注册函数
            //注意每次都要计算funcs.length
            //以防这些函数的调用可能会导致注册更多的函数

            for (var i = 0; i < funcs.length; i++) {
                funcs[i].call(globalDocument);
            }
            //事件处理函数完整执行,切换ready状态, 并移除所有函数

            ready = true;
            funcs = null;
        }
        //为接收到的任何事件注册处理程序

        if (globalDocument.addEventListener) {
            globalDocument.addEventListener('DOMContentLoaded', handler, false);
            globalDocument.addEventListener('readystatechange', handler, false); //IE9+
            globalWindow.addEventListener('load', handler, false);
        } else if (globalDocument.attachEvent) {
            globalDocument.attachEvent('onreadystatechange', handler);
            globalWindow.attachEvent('onload', handler);
        }
        //返回whenReady()函数

        return function whenReady(fn) {
            if (ready) {
                fn.call(globalDocument);
            }
            else {
                funcs.push(fn);
            }
        }
    })();
}

function jsonArrayElement({
    tagName, // = '',
    methods, // = {},
    eventHandlers // = {}
}={}) {
    if (tagName.indexOf('0')!==-1) {
        console.log();
    }
    const ele = globalDocument.createElement(tagName);

    ele.methods = {};
    for (const method_n in methods) {
        const method_func = methods[method_n];
        ele.methods[method_n] = method_func.bind(ele);
    }

    // ele.eventHandlers = {};
    jsonArrayElement.bindEventHandlers({
        ele: ele,
        eventHandlers: eventHandlers
    });
    
    this.ele = ele;
}

jsonArrayElement.bindMethods = function ({
    ele,
    methods // = {},
}) {
    ele.methods = {};
    for (const method_n in methods) {
        const method_func = methods[method_n];
        ele.methods[method_n] = method_func.bind(ele);
    }

    // function updateWithData(data) {
    // }
    // ele.methods.updateWithData = updateWithData.bind(ele);
}

jsonArrayElement.bindEventHandlers = function ({
    ele,
    eventHandlers // = {},
}) {
    ele.eventHandlers = {};
    for (const handler_n in eventHandlers) {
        const handler_func = eventHandlers[handler_n];
        // ele.eventHandlers[handler_n] = handler_func.bind(ele);
        if (handler_n === 'onwindowload') {
            // if (globalDocument.all){
            //     globalWindow.attachEvent('onload',函数名)//IE中
            // }    
            globalWindow.addEventListener('load', handler_func.bind(ele), false);
        } else if (handler_n === 'ondocumentready') {
            setTimeout(()=>{
                globalDocument.whenReady(handler_func.bind(ele));
            }, 0);
            // globalDocument.whenReady(handler_func.bind(ele));
        } else if (handler_n === 'onmutationobserve') {
            const config = { attributes: true, childList: true, subtree: true };
            jsonArrayElement.observeHandlerArr.push(handler_func.bind(ele));
            jsonArrayElement.observer.observe(ele, config);
        } else if (handler_n === 'onresizeobserve') {
            jsonArrayElement.resizeHandlerArr.push(handler_func.bind(ele));
            jsonArrayElement.resizeObserver.observe(ele);
        } else if (handler_n === 'onmessage') {
            // console.log('onmessage: ', ele);
            const func = handler_func.bind(ele);
            ele.eventHandlers[handler_n] = handler_func.bind(ele);
        } else {
            const event_n = handler_n.substring(2); // handler_n is somthing like onclick, onmouseenter ...
            ele.addEventListener(event_n, handler_func.bind(ele));
            // ele[handler_n] = handler_func.bind(ele);
        }
    }
}

jsonArrayElement.createElement = function ({
    tagName, // = '',
    methods, // = {},
    eventHandlers // = {}
}={}) {
    const jArrEle = new jsonArrayElement({
        tagName: tagName,
        methods: methods,
        eventHandlers: eventHandlers
    })
    return jArrEle.ele;
}

jsonArrayElement.createTextNode = function (text) {
    return globalDocument.createTextNode(text);
}

const MutationObserver = globalWindow.MutationObserver || globalWindow.WebKitMutationObserver || globalWindow.MozMutationObserver

jsonArrayElement.observer = new MutationObserver(function (mutations) { // 创建观察者对象
    for (const handler of jsonArrayElement.observeHandlerArr) {
        handler(mutations);
    }
    // mutations.forEach(function (mutation) {
    //     console.log(mutation.type);
    // });
});

jsonArrayElement.observeHandlerArr = [];
jsonArrayElement.resizeHandlerArr = [];


jsonArrayElement.resizeObserver = new ResizeObserver(entries => {
    for (const handler of jsonArrayElement.resizeHandlerArr) {
        handler(entries);
    }
});


// jsonArrayElement.prototype.contains = function(ele, itself){ // $.contains(father, son));
//   // 第一个节点是否包含第二个节点
//   //contains 方法支持情况：chrome+ firefox9+ ie5+, opera9.64+,safari5.1.7+
//   const a = this.ele;
//   const b = ele;
//   if (itself && a == b){
//     return true
//   }
//   if (a.contains){
//     if (a.nodeType === 9) {
//       return true;
//     }
//     return a.contains(b);
//   }
//   else if (a.compareDocumentPosition){
//     return !!(a.compareDocumentPosition(b) & 16);
//   }
//   while ((b = b.parentNode))
//     if (a === b) {
//       return true;
//     }
//   return false;
// }

module.exports = jsonArrayElement;