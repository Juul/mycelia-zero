/*
  Notes about variable naming:
  DOM elements are named node or nodes.
  jQuery elements are named elem or elems.
  Events are named e.
  Exceptions are named err.
*/


var templater = {

    // hash of all compiled templates
    // key is the template name
    // value is the compiled template
    templates: {}, 

    // defaults
    properties: {
	      templates_path: 'templates/', // Where templates are stored. Must include trailing slash.
        template_file_extension: '.html' // File extension used for templates. Must include leading dot.
    },

    /* 
       Attempts to load all external template files 
       specified in the index.html <head> tag 
       using <script type='template/jshtml' src='foo.html'>
    */
    initialize: function(callback) {
	      this.init_callback = callback;
	      this.templates = {};

	      var nodes = $("script[type='template/jshtml'][src]").get();
	      console.log("nodes: " + nodes.length);
	      var i, file, files = [];
	      for(i=0; i < nodes.length; i++) {
	          file = $(nodes[i]).attr('src');
	          if(!file) {
		            throw new ZeroException("Failed to retrieve src attribute for one of the template script tags.");
	          }
	          files.push(file);
	          console.log("file: " + file);
	      }
	      
	      if(files.length > 0) {
	          this.load_files(files);
	      } else {
	          if(this.init_callback) {
		            this.init_callback();
	          }
	      }
	      
    },

    // Load a set of template files using async http get requests
    // and attempts to populate their corresponding 
    // <script src='filename'> tags with the contents of the files.
    // Takes an array of file names as argument.
    load_files: function(filepaths) {
	      
	      var filepath = filepaths.pop();
	      
	      $.get(filepath, function(data) {
	          
	          var elem = $("script[type='template/jshtml'][src='"+filepath+"']");
	          if(!elem || (elem.length != 1)) { // TODO what does jQuery return for no matchs (empty array or null)
		            this.init_callback("Could not match file '"+filepath+"' to its corresponding script tag");
		            return;
	          }
	          
	          // TODO not really needed and probably affects performance
	          elem.html(data);

	          var template_name = this.file_path_to_template_name(filepath);
	          this.add_template(template_name, data);

	          if(filepaths.length > 0) {
		            setTimeout(function() {this.load_files(filepaths)}.bind(this), 0);
	          } else {
		            if(this.init_callback) {
		                this.init_callback();
		            }
	          }
	      }.bind(this)).fail(function() {
	          this.init_callback("Could not load file: " + filepath);
	      }.bind(this));
    },
    
    file_path_to_template_name: function(path) {
	      var re = new RegExp('^'+this.properties.templates_path);
	      path = path.replace(re, ''); // remove path name, leaving only file name
	      re = new RegExp(this.properties.template_file_extension+'$');
	      path = path.replace(re, ''); // remove file extension
	      return path;
    },

    // compile template and add it to the hash of templates
    add_template: function(name, code) {
	      this.templates[name] = _.template(code);
    },

    get: function(name) {
	      return this.templates[name];
    },

    template_name_to_file_path: function(name) {
	      return this.properties.templates_path + name + this.properties.template_file_extension;
    }


};