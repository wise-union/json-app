// const _ = require('lodash');
// const alaSql = require('alasql');
const typeOf = require('./commonUtils/types');
const pubSub = require('./pubsub');
// const jsonArrayComponent = require('./jsonArrayComponent');

function jsonArrayData(dataOptions) { // = {initDataArr: [], subscriptionTopic: ''}) { // dataOptions can be a string, which represents a bind key
    const self = this;
    this.component = null;
    this.initDataArr = null;
    // this.dataArr = null;
    this.subTopic = null;
    this.subToken = null;
    this.isBindDataUsed = false;
    const opts_t = typeOf(dataOptions);
    if (opts_t==='json') {
        if (typeOf(dataOptions.initDataArr)==='array') {
            // self.dataArr = dataOptions.initDataArr;
            self.initDataArr = dataOptions.initDataArr;
            this.isBindDataUsed = true;
        }
        if (typeOf(dataOptions.subscriptionTopic)==='string') {
            self.subTopic = dataOptions.subscriptionTopic;
            self.subToken = pubSub.subscribe(self.subTopic, function(msg, body){
                console.log('4: ', (new Date()).getTime());
                for (const k_opt in body) {
                    const v_data = body[k_opt];
                    if (v_data.dataArr && v_data.dataArr.length>0) self[k_opt](v_data);
                }
            })
            this.isBindDataUsed = true;
        }
    }
    else if (opts_t==='string') {
        this.bindKey = dataOptions.substring(2, dataOptions.length-2);
        this.isBindDataUsed = true;
    }
}

jsonArrayData.prototype.insertBefore = function ({
    position,  //=0,
    dataArr //=[]
}={}) {
    if (!this.dataArr) {
        this.dataArr = [];
    }
    if (position>=this.dataArr.length && this.dataArr.length!==0) {
        console.log('invalid position!');
        return false;
    }
    for (const data of dataArr) {
        this.dataArr.splice(position+1, 0, data);
    }
    console.log('5: ', (new Date()).getTime());
    this.component.onDataChange({
        opType: 'insertBefore',
        position: position,
        dataArr: dataArr
    })
    return this;

}

jsonArrayData.prototype.insertAfter = function ({
    position, //=0,
    dataArr //=[]
}={}) {
    if (!this.dataArr) {
        this.dataArr = [];
    }
    if (position>=this.dataArr.length && this.dataArr.length!==0) {
        console.log('invalid position!');
        return false;
    }
    for (const data of dataArr) {
        this.dataArr.splice(position+1, 0, data);
    }
    console.log('5: ', (new Date()).getTime());
    this.component.onDataChange({
        opType: 'insertAfter',
        position: position,
        dataArr: dataArr
    })
    return this;
}

jsonArrayData.prototype.update = function ({
    position,
    dataArr // ={}
}={}) {
    const data = dataArr[0];
    this.dataArr.splice(position, 1, data);
    this.component.onDataChange({
        opType: 'update',
        position: position,
        dataArr: dataArr
    })
    return this;
}

jsonArrayData.prototype.delete = function ({
    dataArr=[]
}={}) {
    for (const data of dataArr) {
        const pos = data.position;
        if (pos>=this.dataArr.length) {
            console.log('invalid position!');
            return false;
        }
        this.dataArr.splice(pos, 1);
        this.component.onDataChange({
            type: 'delete',
            position: pos
        })
    }
    return this;
}

jsonArrayData.prototype.findIndex = function ({
    key,
    value
}={}){
    const index = this.dataArr.findIndex((data)=>{return data[key]===value});
    return index;
}

jsonArrayData.publish = function (topic, msgObj, toSubscriberArr=['subChildren']) { // toSubscriberArr = ['*'] or toSubscriberArr = [ele1, ele2, ...]
    // [this] will be binded as publisher
    if (this) {
        msgObj.publisher = this;
        msgObj.toSubscriberArr = toSubscriberArr;
    }
    pubSub.publish(topic, msgObj);
}

jsonArrayData.subscribe = function (topic, callback) {
    // [this] will be binded as subscriber
    var this_subscriber;
    if (this) {
        this_subscriber = this;
    }
    pubSub.subscribe(topic, function (msg, msgObj) {
        const {publisher, toSubscriberArr} = msgObj;
        if (toSubscriberArr[0]==='*' || toSubscriberArr.includes(this_subscriber) ) {
            callback(msg, msgObj);
        }
        else if (toSubscriberArr[0]==='subChildren') {
            var p_ele = this_subscriber.parentElement;
            while(p_ele){
                if (p_ele===publisher) {
                    callback(msg, msgObj);
                    break;
                }
                else{
                    p_ele = p_ele.parentElement;
                    if (publisher.parentElement && p_ele===publisher.parentElement) {
                        break;
                    }
                }
            }
        }
    });
}

module.exports = jsonArrayData;