var Pouch = require('pouchdb');
var util = require('util');
var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var Project = require('./project.js');
var hash = require('./hash.js');

var zero = module.exports = {

    config: require('./config.js'),
    printer: null, // set by initialize function

    save_base64_png: function(encoded_data, filename, callback) {

        // base64-decode the png
        var decoded = new Buffer(encoded_data, 'base64');

        // TODO non-static file path
        var filepath = path.join(this.config.label_dir, filename);
        
        fs.writeFile(filepath, decoded, function(err) {
            if(err) {
                console.log('Error saving label: ' + err);
                callback('Error saving label: ' + err);
                return;
            }
            console.log('Label file saved to: ' + filepath);

            if(zero.config.printer.direct) {
                zero.print_file(filepath, function(err) {
                    if(err) {
                        console.log('Error printing label: ' + err);
                        callback('Error printing label: ' + err);
                        return;
                    }
                    console.log("Label " + filepath + " printed");
                    callback(null, filepath);
                }.bind(this));
            } else {
                console.log("Label file " + filepath + " queued for printing");
                callback(null, filepath);     
            }
        }.bind(this));

    },

    print_file: function(png_filepath, callback) {

        var device = this.config.printer.device;
        var paper_type = this.config.printer.paper;
        var threshold = this.config.printer.threshold;

        this.printer.print(device, png_filepath, paper_type, threshold, function(err) {
            if(err) {
                console.log("Print failed: " + err);
                return;
            }
            console.log("Printed!");
        });        
        
    },

    sanity_check: function() {

        // TODO check for existance and executable status
        // of print cmd
        // Check for write-ability of printer device
    },

    project: null, // TODO only one project per node for now

    initialize: function(skip_project_init) {

        this.sanity_check();

        this.printer = require(this.config.printer.driver);

        if(skip_project_init) {
            return this;
        }
        this.project = Project.get('zero');

        // upload new design documents and such
        this.project.setup(function(err) {
            if(err) {
                throw "Initialization failed: " + err;
            }
            console.log("Main project initialized");
        }.bind(this));            
    },

    
    // helper function for express and passport
    // callback gets called if user is authenticated
    requireAuth: function(req, res, callback) {
        if(req.isAuthenticated()) {
            callback();
        } else {
            res.send({error: "not_logged_in", msg: "You must be logged in."});
        }
    },
    
    

};