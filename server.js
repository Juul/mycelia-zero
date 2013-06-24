#!/usr/bin/env node

var util = require('util');
var path = require('path');
var fs = require('fs');
var express = require('express');
var passport = require('passport');
var Pouch = require('pouchdb');
//var fabric = require('fabric').fabric; // requires 'canvas'
//var child_process = require('child_process');
var zero = require('./zero.js');

var LocalStrategy = require('passport-local').Strategy;


// TODO move to config file
var AllUsers = {
    'admin': {
        id: 'admin',
        group: 'admin'
    }
};

passport.use(new LocalStrategy(
    function(username, password, done) {
        // TODO actual login stuff
        if((username == 'admin') && (password == 'admin')) {
            return done(null, AllUsers[username]);
        } else {
            return done(null, false);
        }
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, AllUsers[id]);
});


var app = module.exports = express();

app.configure(function() {
    app.use(express.static(path.resolve(__dirname)));
    app.use(express.cookieParser('mycelia zero secret'));
    app.use(express.session({secret: 'mycelia session secret'}));
    app.use(passport.initialize());
    app.use(passport.session());
});

app.post('/login', express.bodyParser(), function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if(err) { 
            res.send({error: 'login_fail', msg: err});
            return;
        }
        if(!user) { 
            res.send({error: 'login_fail', msg: "Login failed"});
            return;
        }
        req.logIn(user, function(err) {
            if(err) {
                res.send({error: 'login_fail', msg: err});
                return;
            }
            res.send({msg: "Login succeeded", user: user});
            return;
        });
    })(req, res, next);
}, function(err, req, res, next) {
    // called on unexpected errors
    res.send({error: "Login failed: " + err});
});

// get a label image
app.get('/label/:filename', function(req, res) {

    res.setHeader('Content-Type', 'image/png');
    res.sendfile(path.join(zero.config.label_in_dir, req.params.filename));

});

// create a label
app.post('/create', express.bodyParser(), function(req, res) {

    var doc = req.body;
    var user_id = (req.user) ? req.user.id : 'anonymous';

    doc.created_by = user_id;
    doc.last_changed_by = user_id;

    // create a document
    zero.project.create(req.body, function(err, dbresp) {
        if(err) {
            res.send({
                error: 'create_fail',
                msg: "Could not create object: " + err
            });
            return;
        }

        var id = dbresp.id;

        res.send(dbresp);
    });
});


app.get('/objects', express.bodyParser(), function(req, res) {
    zero.project.objects(req.query, function(err, rows) {
        if(err) {
            res.send({error: 'objects_fail', msg: "Could not get objects: " + err});
            return;
        }
        res.send({rows: rows});
    })
});

app.get('/view', express.bodyParser(), function(req, res) {
    zero.project.object(req.query.id, function(err, doc) {
        if(err) {
            res.send({error: 'object_fail', msg: "Could not get object '"+req.query.id+"': " + err});
            return;
        }
        res.send(doc);
    });
});

app.post('/save_and_print_label', express.bodyParser(), function(req, res) {
    
    var png_header = "data:image/png;base64,";

    // base64-encoded png
    var png_encoded = req.body.image.substring(png_header.length);

    var doc = req.body.doc;
    var user_id = (req.user) ? req.user.id : 'anonymous';

    doc.created_by = user_id;
    doc.last_changed_by = user_id;

    // create a document
    zero.project.create(doc, function(err, dbresp) {
        if(err) {
            res.send({
                error: 'create_fail',
                msg: "Could not create object: " + err
            });
            return;
        }

        var id = dbresp.id;
        var filename = id+'.png';
        
        zero.save_base64_png(png_encoded, filename, function(err) {
            if(err) {
                res.json(500, {
                    error: 'png_save_or_print_fail', 
                    msg: err 
                });
                return;
            }
            
            res.json(200, {
                msg: 'Label saved as: ' + filename
            });
        });
    });
});

/*
app.post('/save_label_fabric', express.bodyParser(), function(req, res) {
    var canvas = fabric.createCanvasForNode(req.body.width, req.body.height);
    
    console.log('> Loading JSON ...');
    console.log('image: ' + util.inspect(req.body.image));
    canvas.loadFromJSON(req.body.image, function() {
        canvas.renderAll();
        
        console.log('> Getting PNG data ... (this can take a while)');
        var dataUrl = canvas.toDataURLWithMultiplier('png', req.body.multiplier),
        data = dataUrl.replace(/^data:image\/png;base64,/, '');
        
        console.log('> Saving PNG to file ...');
        var filePath = __dirname + '/labels/test.png';
        fs.writeFile(filePath, data, 'base64', function(err) {
            if(err) {
                console.log('! Error saving PNG: ' + err);
                res.json(200, { error: 'Error saving PNG: ' + err });
            } else {
                console.log('> PNG file saved to: ' + filePath);
                res.json(200, { success: 'PNG file saved to: ' + filePath });
            }
        });
    });
});
*/

app.get('/', function(req, res) {
    res.render("index.html");
});

app.get('/fooauth', express.bodyParser(), function(req, res) {
    zero.requireAuth(req, res, function() {
        res.send({msg: "this is a test"});
//        var data = "Coconuts are delicious.";
//        res.setHeader('Content-Type', 'text/plain');
//        res.setHeader('Content-Length', data.length);

    });
});


zero.initialize();

app.listen(3000);
console.log("Mycelia Zero started on port 3000");


