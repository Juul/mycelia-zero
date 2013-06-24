#!/usr/bin/env node
/*
  This program watches the directory as specified in
  zero.config.label_out_dir (config.js) for new png
  files, prints them and moves them to the dir 
  specified in zero.config.label_in_dir.

  If files are in label_out_dir when this program
  starts, then they are also printed and moved.
*/

var fs = require('fs');
var path = require('path');
var util = require('util');
var zero = require('./zero.js').initialize(true);


function print(filename) {

    if(!filename) {
        return;
    }

    console.log("Printing: " + filename);

    var filepath = path.join(zero.config.label_out_dir, filename);
    zero.print_file(filepath, function(err) {
        if(err) {
            console.log("Printing of " + filename + " failed: " + err);
        }
        console.log("Printed " + filename);

        if(zero.config.label_out_dir != zero.config.label_in_dir) {
            // TODO does not work across filesystems
            // but encountered problem with the mv package
            fs.renameSync(filepath, path.join(zero.config.label_in_dir, filename));
            console.log("Moved file to " + zero.config.label_in_dir);
        }
    });
}

var files = fs.readdirSync(zero.config.label_out_dir);
var i;
for(i=0; i < files.length; i++) {
    if(!files[i].match(/.*\.png$/)) {
        continue;
    }
    print(files[i]);
}

console.log("Listening for new png files in: " + zero.config.label_out_dir);

var last_renamed = null;

// there is no "new file" event
// rather, a new file appears as a rename followed by a change
var watcher = fs.watch(zero.config.label_out_dir, function(event, filename) {
    if(event == 'rename') {
        last_renamed = filename;
        return
    }

    if(event != 'change') {
        last_renamed = null;
        return;
    }
    
    if(last_renamed != filename) {
        return;
    }
            
    if(!filename.match(/.*\.png$/)) {
        return;
    }

    print(filename);
});
