

var helpers = module.exports = {

    // stringify only functions in an object
    stringify_functions: function(obj, seen) {
        seen = seen || [obj];
        var key;
        for(key in obj) {
            if(typeof obj[key] === 'function') {
                obj[key] = obj[key].toString();
            } else if(typeof obj[key] === 'object') {
                if(seen.indexOf(obj[key]) >= 0) {
                    // self-reference detected
                    continue;
                }
                seen.push(obj[key]);
                obj[key] = this.stringify_functions(obj[key], seen);
            }
        }
        return obj;
    },


};