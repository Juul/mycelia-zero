var path = require('path');

var config = module.exports = {
    // TODO move to config file

    printer: {
        driver: __dirname + '/printing/drivers/ql570/ql570.js',
        device: '/dev/usb/lp0',
//        device: '/tmp/fake',
        direct: false, // If set to true, labels are printed directly by the server program. Otherwise they are printed by printer.js running as a separate process.
        // driver-specific options below
        paper: 'w', // 'w' for wide paper, 'n' for narrow
        threshold: 180, // For conversion to monochrome. Any pixel less than this (on a scale from 0-255) is converted to white. Higher or equals becomes black.
    },
    label_out_dir: path.join(__dirname, 'labels/to_print'),
    label_in_dir: path.join(__dirname, 'labels/printed')
    
};
