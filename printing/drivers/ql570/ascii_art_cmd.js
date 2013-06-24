#!/usr/bin/node

var path = require('path');
var ql570 = require('./ql570.js');


function usage(cmd) {
    process.stderr.write("Usage: "+cmd+" pngfile [threshold] > output.txt\n");
    process.stderr.write("  Any pixel with a red, green or blue value less than treshold will be considered white (optional).");
    process.stderr.write("  Example: "+cmd+" example.png 100 > output.txt\n");
    process.stderr.write("  Hint: use '>' to redirect the output into a file, view it with e.g. firefox and zoom way out\n");
}


function main(argv) {

    if(argv.length < 2) {
        usage(argv[0]);
        process.exit(-1);
    }
    var png_filepath = argv[1];
    var threshold;
    if(argv.length > 2) {
        threshold = argv[2];
    }

    ql570.ascii_art(png_filepath, threshold, function(err) {
        if(err) {
            console.log("ascii art generation failed: " + err);
            return;
        }
    });


}

// make argv more C-like
process.argv.splice(0, 1);
process.argv[0] = path.basename(process.argv[0])
main(process.argv);

