#!/usr/bin/node

var path = require('path');
var ql570 = require('./ql570.js');


function usage(cmd) {
    process.stderr.write("Usage: "+cmd+" printer n|w pngfile [threshold]\n");
    process.stderr.write("  Where 'n' is narrow paper (29 mm) and 'w' is wide paper (62 mm).\n");
    process.stderr.write("  Any pixel with a red, green or blue value less than treshold will be considered white (optional).");
    process.stderr.write("  Example: "+cmd+" /dev/usb/lp0 n example.png 100\n");
    process.stderr.write("  Hint: If the printer's status LED blinks red, then your media type is probably wrong.\n");
}


function main(argv) {

    if(argv.length < 4) {
        usage(argv[0]);
        process.exit(-1);
    }

    var device = argv[1];
    var paper_type = argv[2];
    var png_filepath = argv[3];
    var threshold;
    if(argv.length > 4) {
        threshold = argv[4];
    }

    ql570.print(device, png_filepath, paper_type, threshold, function(err) {
        if(err) {
            console.log("Print failed: " + err);
            return;
        }
        console.log("Printed!");
    });


}

// make argv more C-like
process.argv.splice(0, 1);
process.argv[0] = path.basename(process.argv[0])
main(process.argv);

