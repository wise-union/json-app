const jsonArrayComponent = require("../jsonArrayComponent");

function findValueByKey(obj, key) {
    let value;
    for (let prop in obj) {
        // console.log(prop, obj[prop]);
        if (prop === key) {
            return obj[prop];
        } else if ( typeof obj[prop] === 'object' && !(obj instanceof jsonArrayComponent) ) {
            value = findValueByKey(obj[prop], key);
            if (value) {
                return value;
            }
        }
    }
    return null;
}

// const obj = [{
//     "a": 1,
//     "b": {
//         "c": 2,
//         "d": {
//             "e": 3,
//             "f": [
//                 {"g": 4},
//                 {"h": 5}
//             ]
//         }
//     }
// }];

// console.log(findValueByKey(obj, "c")); // 输出 2
// console.log(findValueByKey(obj, "f")); // 输出 4
// console.log(findValueByKey(obj, "h"));

module.exports = findValueByKey;