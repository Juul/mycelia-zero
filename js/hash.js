
var hash = {

    // calculate the SHA1 hash of str
    sha1: function(str) {
        return hex_sha1(str); // uses sha1.js
    },

    // generate a guid
    guid: function() {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, function(char) {
            var num = (Math.random() * 16) | 0;
            return num.toString(16);
        });
    },
   
};