#!/usr/bin/env node
/*
  This program watches a directory for new .png files
  and prints them 



*/

var fs = require('fs');
var path = require('path');
var util = require('util');
var zero = require('./zero.js').initialize(true);

var last_renamed = null;

console.log("Listening for new png files in: " + zero.config.label_dir);

// there is no "new file" event
// rather, a new file appears as a rename followed by a change
var watcher = fs.watch(zero.config.label_dir, function(event, filename) {
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

    console.log("Printing: " + filename);

    var filepath = path.join(zero.config.label_dir, filename);

    zero.print_file(filepath, function(err) {
        if(err) {
            console.log("Printing of " + filename + " failed: " + err);
            return;
        }
        console.log("Printed " + filename);
    });

});
