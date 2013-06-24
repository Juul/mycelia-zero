
// TODO move to top level utility thingy

var ZeroException = function(message) {
    this.message = message;
    this.name = "ZeroException";
};

var zero = {

    config: {
        qrcode_base_url: 'http://o.sudoroom.org/',
        short_base_url: 'ven.li/',
    },

    go: function(anchor) {
        window.location.href = '#'+anchor;
    },

    short_url: function(id) {
        if(!id) {
            return this.config.short_base_url+'?'
        }
    },

    // TODO move this convenience method
    bind_with_self: function(fnc, self) {
	      return function() {
	          return fnc.apply(this, [self]);
	      }
    },

    zero: null,

    // Should be called when the DOM is ready
    initialize: function(callback) {
	      try {
	          console.log("Initializing zero");
            
	          if(!templater) {
		            throw new ZeroException("Template loader missing. Is the js/templater.js file there and does it have the correct permissions?");
	          }
                
	          // Load external template files as needed
	          templater.initialize(function(err) {
		            if(err) {
		                this.fatal("Initialization failed. Templater error: " + err);
		                return;
		            }
		            // Initialize controller
		            controller.initialize();
                
                this.status("initialized!");
                
		            console.log("Initialization completed!");
	          }.bind(this));

	      } catch(err) {
	          
	          this.fatal("The web app failed to load: " + err.message);
            
	      }
                                      
                                     
    },

    status: function(msg) {
        $('#status').html(msg);
    },

    // Fatal error.
    fatal: function(msg) {
        // TODO handle properly
	      console.error(msg);
	      alert(msg);
	      return false;
    }

};