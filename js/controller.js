
var controller = {

    // TODO should be in a config file
    config: {
        objs_per_page: 20
    },

    initialize: function() {

	      // Routes for zero web app
	      // routes not explicitly defined are automatically mapped
	      // to the method in controller.unmappedname
	      // or if that does not exist, a view of the same name
	      // as the unmapped name is shown in #content
	      // or if that does not exist, 
	      // the controller._404 function is run

	      this.routes = {
            //	    '': this.index
	      };

	      this.router = Router(this.routes).configure({
            
	          notfound: zero.bind_with_self(function(self) {
		            var path = this.path;
		            // note: 'self' is used instead of 'this' 
		            //        in the rest of this function.

                console.log('path: ' + path);

		            // The function 'initialize' and
		            // all functions starting with '_'
		            // are hidden.
                // TODO Sometimes Director sends the full URL as the path when hitting the back button when there is no #something at the end of the URL. We deal with that.
		            if((path === '') || path.match(/^http:\/\//) || path.match(/^https:\/\//)) {
		                self.index();
		                return;
		            }
                
		            if((path != 'initialize') &&
		               (path[0] != '_')) {
                    var args = path.split('/');
                    if(args.length > 1) {
                        path = args[0];
                        args = args.slice(1, args.length);
                    } else {
                        args = [];
                    }
		                if(self[path]) {
                        // run function named same as path
                        self[path].apply(this, args)
			                  //self[path](args);
		                } else {
			                  if(!self._render_default(path)) {
			                      self._404(path);
			                  }
			                  return;
		                }
		            } else {
		                self._404(path);
		                return;
		            }
	          }, this)
	      });
	      this.router.init();
    },

    // assign events to elements based on
    // a backbone-style events hash
    _assign_events: function(events, target) {
        var key, handler, selector, event_type, s, elements;
        for(key in events) {
            handler = events[key];
            s = key.split(/\s+/);
            event_type = s.pop();
            selector = s.join(' ');

            if(!event_type) {
                console.log("DEBUG: Attempted to assign unknown event type '"+event_type+"'");
                return false;
            }
            
            elements = $(target).find(selector);
            if(!elements || (elements.length == 0)) {
                console.log("DEBUG: Could not find target for events assignment: " + target);
                return false;
            }
            
            // onclick client side submit event
            if(event_type == 'zsubmit') {
                var form = $(elements[0]).closest('form');
                this._bind_zsubmit(form, 'submit', handler);

                // if we're not binding to a submit button
                // make whatever we're binding to do a submit
                if(elements[0].type != 'submit') {
                    elements.bind('click', null, function(e) {
                        $(e.target).closest('form').submit();
                    }.bind(this));
                }

            } else  {
                elements.bind(event_type, null, handler);
            }
        }
        
    },
    
    _bind_zsubmit: function(elements, event_type, handler) {
        elements.bind(event_type, null, function(e) {
            e.preventDefault();
            this._zsubmit(e, handler);
        }.bind(this));
    },

    _zsubmit: function(e, handler) {
        // find parent form and get form data as object
        var form = $(e.target).closest('form');
        var data = form.formToObject();

        handler(form, data);
        return false;
    },

    _add_validation: function(target, rules) {

        $(form).validate({
            rules: {
                name: {
                    minlength: 10,
                    required: true
                }
            },
            showErrors: function(errorMap, errorList) {

                $.each(this.successList, function(index, value) {
                    return $(value).popover("hide");
                });
                return $.each(errorList, function(index, value) {
                    var _popover;
                    _popover = $(value.element).popover({
                        trigger: "manual",
                        placement: "top",
                        content: value.message,
                        template: "<div class=\"popover\"><div class=\"arrow\"></div><div class=\"popover-inner\"><div class=\"popover-content\"><p></p></div></div></div>"
                    });
                    _popover.data("popover").options.content = value.message;
                    return $(value.element).popover("show");
                });
            }
        });
    },

    _add_validations: function(validations) {
        var selector, rules, target;
        for(selector in validations) {
            target = $(selector);
            if(target.length == 0) {
                continue;
            }            
        }
    },
    
    _render: function(template_name, target, o, events, validations) {
	      var template = templater.get(template_name);
	      if(!template) {
	          console.log("Unknown template '" + template_name +"'. Check that the file '"+ templater.template_name_to_file_path(template_name) + "' exists.");
	          return false;
	      }
        o = o || {};
	      if(!target) {
	          return template(o);
	      } else {
	          $(target).html(template(o));
            if(events) {
                this._assign_events(events, target);
            }
            if(validations) {
                this._add_validations(validations, target);
            }
	      }
    },

    _render_default: function(template_name, o, events) {
	      var html = this._render(template_name, null, o);
	      if(!html) {
	          return false;
	      }
	      $('#content').html(html);
	      return true;
    },
    
    _404: function(pagename) {
	      var html = this._render('404', null, {pagename: pagename});

	      if(!html) {
	          alert('Tried to display a 404 error. But displaying the error failed :-(');
	          return false;
	      }
	      $('#content').html(html);
	      return true;
    },

    index: function() {

    },

    test: function() {
	      console.log("running test");
	      this._render('test', '#content');
	      labitrack.qrcode_test();
    },


    create: function() {
	      // render the create.html template to the #content div

        var o =  {
            tags: [
                {name: 'dnh', label: 'DNH', description: 'Do Not Hack'},
                {name: 'person', label: 'Person', description: 'Owned by a member'},
                {name: 'manual', label: 'RTFM', description: 'Read the manual / receive training before use'}
            ]
        };

        var validations = {
            '#labelform': {
                name: {
                    minlength: 10,
                    required: true
                }                
            }
        };

        function update_qrcode_preview(e) {
            var data = $('#labelform').formToObject();
            data.id = '?';
            data.url = zero.short_url();
            if(data.tags) {
                // TODO this conversion should be in zero.form_to_object, and be automatic based on input names that end in []
                if(!(data.tags instanceof Array)) {
                    data.tags = [data.tags];
                }
            }
            labitrack.qrcode(data, true, '#label');
        };

        var events = {
            '#saveandprint zsubmit': function(form, doc) {

                doc.type = 'object'; // TODO add types;
                doc.url = 'ven.li/fake'; // TODO real url
                doc._id = hash.guid();
                
                var ctx = labitrack.qrcode(doc);
                var canvas = ctx.canvas;
                
                var o = {
                    doc: doc,
                    image: canvas.toDataURL('image/png')
                };
                
                
                $.post('/save_and_print_label', o, function(response) {
                    if(response.error) {
                        // TODO handle errors
                        console.log("Error: " + response.msg);
                        return;
                    }

                    console.log("Label saved and printed and document created");
                    
                    // TODO some kind of flash notification

                    console.log('view/'+doc._id);
                    zero.go('view/'+doc._id);

                }.bind(this));
            }.bind(this),

            '#labelform input keyup': update_qrcode_preview.bind(this),
            '#labelform textarea keyup': update_qrcode_preview.bind(this),
            '#labelform input:checkbox click': update_qrcode_preview.bind(this)
        };

	      this._render('create', '#content', o, events, validations);
        
        update_qrcode_preview();

        // enable fabric features for canvas
//        var f = new fabric.Canvas('label');
//        $('#label')[0].fabric = f; // store ref
        
    },

    view: function(id) {

        $.get('/view', {id: id}, function(doc) {
            // TODO how do we handle errors?

            var o =  {
                doc: doc,
                wiki_link: 'http://sudoroom.org/wiki',
                edit_link: 'http://sudoroom.org',
                barcode_filepath: '/label/'+id+'.png'
            };
            
            var events = {
                
            };
            
	          this._render('view', '#content', o, events);
        }.bind(this));
    },


    paginator_: function(objs, prev_key, next_key) {

        var o = {
            prev_link: null,
            next_link: null
        };
                    // TODO remove hardcoded paths
        if(prev_key !== null) {
            o.prev_link = '/#browse/' + prev_key;
        } 
        if(next_key !== null) {
            o.next_link = '/#browse/' + next_key;
        }
        return this._render('paginator_', null, o);
    },

    // sub-templates end with and underscore
    object_table_: function(objs, prev_key, next_key) {

        var o = {
            paginator: this.paginator_(objs, prev_key, next_key),
            objs: objs
        };

        return this._render('object_table_', null, o);
    },

    // TODO hmm, not the best place to keep state info
    browse_history: [], // startkeys of previous pages

    browse: function(startkey) {
           
        var query = {
            startkey: startkey || undefined,
            limit: this.config.objs_per_page + 1
        };
        
        // fetch objects and render table
        $.get('/objects', query, function(data) {
            
            var prevkey = null;
            var nextkey = null;
            if(data.rows.length > this.config.objs_per_page) {
                nextkey = data.rows.pop().key;
            }

            var objs = data.rows.map(function(row) {
                return row.value;
            });

            // TODO this whole history tracking is kinda ugly
            // can we do something better?
            if(this.browse_history.length > 0) {
                // this is a "browse to prev", so pop a key
                if(this.browse_history[this.browse_history.length-2] == startkey) {
                    this.browse_history.pop();
                } else {
                    this.browse_history.push(data.rows[0].key);
                }
            } else {
                this.browse_history.push(data.rows[0].key);
            }

            if(!startkey) {
                this.browse_history = [];
            }

            if(this.browse_history.length > 1) {
                prevkey = this.browse_history[this.browse_history.length-2];
            }

            // allow going back to first page
            if(startkey && !prevkey) {
                prevkey = '';
            }

            var o = {
                object_table: this.object_table_(objs, prevkey, nextkey)
            };

            var events = {
                
            };



	          this._render('browse', '#content', o, events);
        }.bind(this));        

    },

    login: function() {

        var validations = {
            username: {
                required: true
            },
            password: {
                required: true
            }
        };

        var events = {
            '#btn-login zsubmit': function(form, formdata) {
                $.post('/login', formdata, function(login_result) {
                    if(!login_result || login_result.error) {
                        // TODO not implemented
                        console.log("Login failed");
                        return;
                    }
                    console.log("Logged in as: " + login_result.user.id);
                });
            }.bind(this)
        };

	      this._render('login', '#content', {}, events, validations);
    },

/*
http://stackoverflow.com/questions/8439490/how-to-use-twitter-bootstrap-popovers-for-jquery-validation-notifications

  validators
*/

};
_.bindAll(controller);