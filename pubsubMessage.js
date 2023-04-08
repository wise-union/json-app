const pubsub = require('./pubsub');
// const PubSub = require('pubsub-js');

const pubsubMessage = function () {
    this.msg = {};
    this.msg.insertBefore = {};
    this.msg.insertAfter = {};
    this.msg.update = [];
    this.msg.delete = [];
}

pubsubMessage.prototype.insertBefore = function ({
    position=null,
    dataArr=[]
}={}) {
    this.msg.insertBefore.position = position;
    this.msg.insertBefore.dataArr = dataArr;
    return this;
}


pubsubMessage.prototype.insertAfter = function ({
    position=null,
    dataArr=[]
}={}) {
    this.msg.insertAfter.position = position;
    this.msg.insertAfter.dataArr = dataArr
    return this;
}


pubsubMessage.prototype.update = function ({
    position,
    dataArr=[]
}={}) {
    this.msg.update.position = position;
    this.msg.update.dataArr = dataArr;
    return this;
}

pubsubMessage.prototype.delete = function ({
    dataArr=[]
}={}) {
    this.msg.update.dataArr = dataArr;
    return this;
}

pubsubMessage.prototype.publish = function (topic) { // = '') {
    pubsub.publish(topic, this.msg);
}

module.exports = pubsubMessage;