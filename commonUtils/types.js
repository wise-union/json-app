// const typeofArguments = require('typeof-arguments');
// const checkTypes = require('check-types');

const publishReg = /^\[[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*>>$/;
const subscriptionAttrReg = /^>>[a-zA-Z]+[0-9]*\.[a-zA-Z]+[0-9]*\]$/;
const subscriptionDataReg = /^>>[a-zA-Z]+[0-9]*\]$/;

function _typeof(targetVar) {
    var type = typeof targetVar;
    if (type === 'string') {
        if ( publishReg.test(targetVar) ) return 'string.publish';
        if ( subscriptionAttrReg.test(targetVar) ) return 'string.subscriptionAttr';
        if ( subscriptionDataReg.test(targetVar) ) return 'string.subscriptionData';
        return 'string';
    }
    else if (type !== 'object') {
        return type;
    }
    return Array.isArray(targetVar) ? 'array' : 'json';
}

function realCheck(param) {
    this.param = param;
    return this;
}

function check(param) {
    return new realCheck(param);
}

realCheck.prototype.typeof = function (type) {
    // checkTypes.
}

check(99).typeof('number')

module.exports = _typeof;
