var util = require('util');
var fs = require('fs');
var path = require('path');
var PNG = require('pngjs').PNG;




var ql570 = module.exports = {

    ESC: 0x1b,

    // paper widths in mm
    PAPER_WIDTH_NARROW: 29,
    PAPER_WIDTH_WIDE: 62,

    buf: null,
    bytes: 0,

    // debug function
    // outputs monochrome png as ascii art
    generate_ascii_art: function(monochrome, width, height) {
        var x, y, i;
        for(x=0; x < width; x++) {
            for(y=height-1; y >= 0; y--) {
                i = x * height + y;
                if(monochrome[i]) {
                    process.stdout.write('#');
                } else {
                    process.stdout.write(' ');
                }
            }
            process.stdout.write("\n");
        }
    },
    
    loadpng: function(path, threshold, callback) {
        
        var threshold = threshold || 180; // threshold for monochrome
        var monochrome = [];
        var width;
        var height;

        fs.createReadStream(path)
            .pipe(new PNG())
            .on('parsed', function() {
                width = this.width;
                height = this.height;
                var bit = 0;
                var i, idx;
                for (var y = 0; y < this.height; y++) {
                    for (var x = 0; x < this.width; x++) {
                        i = x * height + y; // index into 90 degree rotated bit array (monochrome)
                        idx = (y * width + x) << 2; // index into png file array
                        
                        // TODO inefficient to use one integer per bit!
                        
                        // invert color
                        if((this.data[idx] < threshold) || (this.data[idx+1] < threshold) || (this.data[idx+1] < threshold)) {
                            monochrome[i] = 1;
                        } else {
                            monochrome[i] = 0;
                        }
                        
                        bit = (bit + 1) % 8;
                    }
                }
                
                //            ascii_art()
                // TODO no possible errors?
                callback(null, monochrome, width, height);
            });
    },


    allocate_buffer: function() {
        var size = 200000; // 200 k ought to be enough for anybody
        this.buf = new Buffer(size, 'binary');
        this.bytes = 0;
    },

    write_buffer: function() {
        if(arguments.length < 1) {
            throw "Error: write_buffer called with no arguments";
        }
        var i;
        for(i=0; i < arguments.length; i++) {
            if(typeof arguments[i] == 'string') {
                this.buf.write(arguments[i], this.bytes+i);
            } else if(typeof arguments[i] == 'number') {
                this.buf.writeUInt8(arguments[i], this.bytes+i);
            }
        }
        this.bytes += arguments.length;
    },

    write_buffer_to_printer: function(path) {
        var fd = fs.openSync(path, 'w');
        fs.writeSync(fd, this.buf, 0, this.bytes);
    },


    ql570_write: function() {
        if(arguments.length < 2) {
            throw "Error: ql570_write called with fewer than two arguments";
        }
        var fd = arguments[0];
        var buffer = new Buffer(arguments.length - 1);
        this.bytes += buffer.length;

        var i;
        for(i=1; i < arguments.length; i++) {
            if(typeof arguments[i] == 'string') {
                buffer.write(arguments[i], i-1);
            } else if(typeof arguments[i] == 'number') {
                buffer.writeUInt8(arguments[i], i-1);
            }
        }
        fs.writeSync(fd, buffer, 0, buffer.length);
    },

// convert image to ql570 format and write to buffer
    ql570_format: function(monochrome, width, height, paper_width) {
        
        var qwidth = height;
        var qheight = width;
        
	      /* Init */
	      this.write_buffer(this.ESC, '@');
        
	      /* Set media type */
	      this.write_buffer(this.ESC, 'i', 'z', 0xa6, 0x0a, paper_width, 0, 0x3b, 0x04, 0, 0, 0, 0);
        // 15
        
	      /* Set cut type */
	      this.write_buffer(this.ESC, 'i', 'K', 8);
        
	      /* Enable cutter */
	      this.write_buffer(this.ESC, 'i', 'A', 1);
        
	      /* Set margin = 0 */
	      this.write_buffer(this.ESC, 'i', 'd', 0, 0);
        
    /* write image data */
        var x, y, i, bit=0, cbyte=0;
        for(x=0; x < width; x++) {

		        this.write_buffer('g', 0x00, 90);

            for(y=0; y < height; y++) {
                i = x * height + y;
                
                if(monochrome[i]) {
                    cbyte |= (1 << (7 - bit));
                }
                
                bit++;
                
                if(bit == 8) {
			              this.write_buffer(cbyte);
                    cbyte = 0x00;
                    bit = 0;
                }
            }
            if(bit > 0) {
                this.write_buffer(cbyte);
                cbyte = 0x00;
                bit = 0;
            }
            bit = 0;
            for(;y<90*8;y++) {
                
                bit++;
                
                if(bit == 8) {
			              this.write_buffer(0x00);
                    bit = 0;
                }
                
            }
        }
        
	      /* Print */
	      this.write_buffer(0x1a);
    },


    /*
      printer_device: e.g. /dev/usb/lp0
      filepath: e.g. example.png, this must be a 1083x336 PNG
      paper_type: 'w' for wide paper, 'n' for narrow paper
      threshold: grayscale/rgb to monochrome cutoff value between 0 and 255. default is 180
    */

    print: function(printer_device, filepath, paper_type, threshold, callback) {
        
        if(!printer_device) {
            if(callback) {
                callback("you must specify the printer_device, e.g: /dev/usb/lp0");
            }
            return;
        }

        if(!filepath) {
            if(callback) {
                callback("you must specify the file to print. e.g: example.png");
            }
            return;
        }

        var paper_width;
        if(paper_type == 'n') {
            paper_width = this.PAPER_WIDTH_NARROW;
        } else if(paper_type == 'w') {
            paper_width = this.PAPER_WIDTH_WIDE;
        } else {
            if(callback) {
                callback("paper_type must be 'n' or 'w', it was: " + paper_type);
            }
            return;
        }

        this.loadpng(filepath, threshold, function(err, monochrome, width, height) {
            if(err) {
                if(callback) {
                    callback("Error loading PNG: " + filepath + ": " + err);
                }
                return;
            }

            this.allocate_buffer();
            this.ql570_format(monochrome, width, height, paper_width);
            this.write_buffer_to_printer(printer_device);

            if(callback) {
                callback(null);
            }
    
        }.bind(this));
    },

   
    /* generate ascii art of the monochrome
       view it using e.g. firefox and zooming way out
     */
    ascii_art: function(filepath, threshold, callback) {
        
        if(!filepath) {
            if(callback) {
                callback("you must specify the file to print. e.g: example.png");
            }
            return;
        }

        this.loadpng(filepath, threshold, function(err, monochrome, width, height) {
            if(err) {
                if(callback) {
                    callback("Error loading PNG: " + filepath + ": " + err);
                }
                return;
            }

            this.generate_ascii_art(monochrome, width, height);

        }.bind(this));
    }


};