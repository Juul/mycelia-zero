var Pouch = require('pouchdb');
var fs = require('fs');
var path = require('path');
var util = require('util');
var hash = require('./hash.js');
var helpers = require('./helpers.js');

var Project = module.exports = {


    // create a new project
    create: function(id, callback) {


    }, 

    // get an existing project
    get: function(id) {
        
        return new this._Project(id);;
    },

    // the parent object used to instantiate
    // project objects
    _Project: function(id) {

        this.db_ddoc_dir = 'db_ddocs', // TODO hardcoded
        this.db_prefix = 'project-';
        this.db = null;

        this.project_id = id;

        this.initialize = function(id) {
            this.db = Pouch(this.db_prefix + id);
            // TODO create the project document
            
        };

        this.setup = function(callback) {
            console.log('tralala');
            this.create_ddocs(callback)            
        };

        // install or re-install design documents
        this.create_ddocs = function(callback) {


            var ddocs = [];
            fs.readdir(this.db_ddoc_dir, function(err, files) {
                if(err) {
                    throw "Could not read "+this.db_ddoc_dir+" dir";
                }
                
                var i, file, filepath, ddoc;
                for(i=0; i < files.length; i++) {

                    try {
                        file = files[i];
                        filepath = './' + path.join(this.db_ddoc_dir, file);
                        // ignore non js files
                        if(!filepath.match(/\.js$/)) {
                            continue;
                        }
                        console.log('== ' + filepath);
                        ddoc = require(filepath);
                        // create id if mising
                        if(!ddoc._id) {
                            var m = file.match(/(.*)\.js$/);
                            if(!m || (m.length < 2)) {
                                throw "ddoc file is missing id: " + file;
                            }
                            // if the filename is foo.js
                            // then the _id will be _design/foo.js
                            ddoc._id = '_design/'+m[1];
                        }
                        ddocs.push(ddoc);

                    } catch(e) {
                        console.log("Could not include design document '"+filepath+"': "+e.message);
                    }
                }

                
                this.create_ddocs_recursive(ddocs, callback);
                
            }.bind(this));
        };


        this.create_ddocs_recursive = function(ddocs, callback) {

            if(ddocs.length <= 0) {
                process.nextTick(function() {
                    if(callback) {
                        callback(null);
                    }
                });
                return;
            }
            var ddoc = ddocs.pop();

            this.db.get(ddoc._id, function(err, doc) {
                if(err) {
                    // ddoc does not exist, so create it
                    this.db.post(helpers.stringify_functions(ddoc), function(err, reponse) {
                        if(err) {
                            throw "Could not create ddoc: " + ddoc._id;
                        }
                        console.log("created: " + ddoc._id);
                        this.create_ddocs_recursive(ddocs, callback);
                    }.bind(this));
                } else {
                    // ddoc exists, so update it
                    ddoc._rev = doc._rev;
                    this.db.put(helpers.stringify_functions(ddoc), function(err, response) {
                        if(err) {
                            throw "Could not update ddoc: " + ddoc._id;
                        }
                        console.log("updated: " + ddoc._id + " to rev: " + response.rev);
                        this.create_ddocs_recursive(ddocs, callback);
                    }.bind(this));
                }
            }.bind(this));
        };


        // naive validation for now
        this.validate_doc = function(doc) {
            var errors = [];
            if(!doc._id) {
                errors.push("Document must have an _id");
            }
            if(!doc.type) {
                errors.push("Document must have a type");
            }
            if(!doc.created_time) {
                errors.push("Document must have a created_time field");
            }
            if(!doc.created_by) {
                errors.push("Document must have a created_by field");
            }
            if(!doc.last_changed_by) {
                errors.push("Document must have a last_changed_by field");
            }
            if(!doc.last_changed_time) {
                errors.push("Document must have a last_changed_time field");
            }
            if(errors.length > 0) {
                return errors;
            }
            return false;
        }

        // update object
        this.update = function(doc, callback) {
            doc.project_id = this.project_id;
            doc.last_changed_time = new Date();

            var err = this.validate_doc(doc);
            if(err) {
                callback(err.join(" - "));
                return;
            }
            if(!doc._id || !doc._rev) {
                callback("Cannot update a document that does not have both _id and _rev");
                return;
            }


            this.db.put(doc, function(err, resp) {
                if(!err) {
                    callback(null, resp);
                } else {
                    callback("Database error: " + err);
                }
            });
        },

        // create a new document
        this.create = function(doc, callback) {
            doc._id = hash.guid();
            doc.created_time = new Date();
            doc.last_changed_time = new Date();

            var err = this.validate_doc(doc);
            if(err) {
                if(callback) {
                    callback(err.join(" - "));
                }
                return;
            }
            doc.project_id = this.project_id;
            this.db.post(doc, function(err, resp) {
                if(!err) {
                    callback(null, resp);
                } else {
                    callback("Database error: " + err);
                }
            });
        };

        this.object = function(id, callback) {
            this.db.get(id, function(err, doc) {
                if(err) {
                    callback(err);
                    return;
                }
                // TODO what if the id is wrong
                callback(null, doc);
            });
        };

        // get all objects
        this.objects = function(opts, callback) {
            if(!opts.view) {
                callback("Tried to fetch objects without specifying view");
                return;
            }
            var view = 'objects/'+opts.view;
            opts = {
                startkey: opts.startkey,
                limit: parseInt(opts.limit)
            };

            this.db.query(view, opts, function(err, response) {
                if(err) {
                    callback(err);
                    return;
                }
                if(!response.rows) {
                    callback(null, []);
                    return;
                }
                console.log('REQ: ' + util.inspect(opts));
                console.log('resonse: ' + util.inspect(response));
                callback(null, response.rows);
            });
        };


        this.initialize(id);
    }
};