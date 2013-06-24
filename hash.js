var crypto = require('crypto');

var hash = module.exports = {
    sha1: function(str) {
        var shasum = crypto.createHash('sha1');
        shasum.update(str);
        return shasum.digest('hex');
    },

    // generate a globally unique id
    guid: function() {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, function(char) {
            var num = (Math.random() * 16) | 0;
            return num.toString(16);
        });
    }

};

