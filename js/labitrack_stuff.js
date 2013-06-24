
var labitrack = {};

(function(labitrack){

    labitrack.utils = {};
    labitrack.utils.new_context = function(w, h){
	      var canvas = document.createElement('canvas');
	      canvas.width = w;
	      canvas.height = h;
	      return canvas.getContext('2d');
    };
    
    // Color quantization using Euclidean distance
    // https://en.wikipedia.org/wiki/Euclidean_distance
    // We don't do any alpha blending for now
    labitrack.utils.convert_to_monochrome = function(data){
	      var p = data.data;
	      for(var i = 0, l = p.length; i < l; i+=4) {
	          var v = (p[i+3] === 0 // handle alpha
		                 ||
		                 (Math.pow(p[i], 2) + Math.pow(p[i+1], 2) + Math.pow(p[i+2], 2))
		                 >
		                 (Math.pow(255-p[i], 2) + Math.pow(255-p[i+1], 2) + Math.pow(255-p[i+2], 2))
		                ) * 255;
	          p[i] = p[i+1] = p[i+2] = v;
	          p[i+3] = 255;
	      }
    };
    
    labitrack.utils.time = function(callback){
	      var start = Date.now();
	      var end = start;
	      callback();
	      end = Date.now();
	      return end - start;
    };
    
    labitrack.is_browser_supported = function() {
	      function supportsToDataURL() {
	          var c = document.createElement("canvas");
	          var data = c.toDataURL("image/png");
	          return (data.indexOf("data:image/png") == 0);
	      }
	      
	      if(Modernizr.canvas
	         && Modernizr.canvastext
	         && Modernizr.fontface
	         && supportsToDataURL()) {
	          return true;
	      } else {
	          return false;
	      }
    };
    
}(labitrack));


// if preview is true, then a lower resolution is used
// if no selector, then the bitmap is returned instead
labitrack.qrcode = function(data, preview, selector) {
/*
    var data = {
	      _id: "42",
	      name: "Foolabel",
	      desc: "I am a foolabel",
	      tags: ['dnh', 'person', 'manual']
    };
*/
    var o = labitrack.draw(data, preview); // draw bitmap as preview
    if(selector) {
        var canvas = $(selector).get()[0];
        labitrack.update_canvas(canvas, o.bitmap);
    }
    return o.ctx;
};


labitrack.qrcode_test = function() {

    var mindata = {
	      id: "42",
	      name: "Foolabel",
	      desc: "I am a foolabel",
	      tags: ['dnh', 'person', 'manual']
    };

    var o = labitrack.draw(mindata, true); // draw bitmap as preview
    
    var canvas = $('#qrcode_preview').get()[0];
    //    console.log('--- ' + canvas.length);
    labitrack.update_canvas(canvas, o.bitmap);
};


labitrack.update_canvas = function(canvas, bitmap) {
    if (bitmap !== null && canvas !== null) {
	      canvas.width = bitmap.width;
	      canvas.height = bitmap.height;
	      var ctx = canvas.getContext('2d');
	      ctx.putImageData(bitmap, 0, 0);
    }
};


labitrack.draw = function() {
    
    var code = null;
    var qrcode_url = null;
    var left=1;
    var right=2;

    function drawCircle(ctx) {
	      ctx.beginPath();
	      ctx.arc(40, 0, 40, 0, Math.PI*2);
	      ctx.lineWidth = 8;
	      ctx.stroke();
	      ctx.closePath();
    }

    function roundedRect(ctx, x, y, w, h, r) {
	      ctx.save();
	      ctx.translate(x, y);
	      ctx.moveTo(0, r);
	      ctx.arc(r, r, r, Math.PI, Math.PI*1.5);
	      ctx.lineTo(w-r, 0);
	      ctx.arc(w-r, r, r, Math.PI*1.5, Math.PI*2);
	      ctx.lineTo(w, h-r);
	      ctx.arc(w-r, h-r, r, 0, Math.PI*0.5);
	      ctx.lineTo(r, h);
	      ctx.arc(r, h-r, r, Math.PI*0.5, Math.PI);
	      ctx.lineTo(0, r);
	      ctx.restore();
    }

    function measureCircle(ctx) {
	      return {width: 82, align: left};
    }

    function drawPerson(ctx, x, y) {
	      var m = this.measure(ctx);
	      ctx.save();
	      ctx.translate(x, y);

	      drawCircle(ctx);

	      ctx.beginPath();
	      ctx.arc(40, -25, 7.5, 0, Math.PI*2);
	      ctx.rect(32, -15, 16, 3);
	      ctx.moveTo(32, -12);
	      ctx.arc(32, -12, 2.5, Math.PI*1, Math.PI*1.5);
	      ctx.moveTo(48, -12);
	      ctx.arc(48, -12, 2.5, Math.PI*1.5, Math.PI*2);
	      ctx.rect(28, -12, 24, 20);
	      ctx.rect(32, 8, 16, 20);
	      ctx.fill();
	      ctx.closePath();

	      ctx.restore();

	      return m.width;
    }

    var stamplinewidth = 8;

    function drawManual(ctx, x, y) {
	      var m = this.measure(ctx);
	      ctx.save();
	      ctx.translate(x, y);

	      drawCircle(ctx);

	      ctx.beginPath();
	      ctx.moveTo(6, -25);
	      roundedRect(ctx, 20, -25, 30, 40, 5);
	      roundedRect(ctx, 30, -15, 30, 40, 5);
	      ctx.lineWidth = 4;
	      ctx.stroke();
	      ctx.closePath();

	      ctx.restore();

	      return m.width;
    }


    function measureStamp(ctx, label)
    {
	      ctx.font = '60px sans-serif';
	      var tm = ctx.measureText(label);
	      return {width: tm.width + 40 + 8, align: right};
    }

    function drawStamp(ctx, label, x, y)
    {
	      ctx.save();
	      ctx.translate(x, y);

	      ctx.font = '60px sans-serif';
	      var tm = ctx.measureText(label);

	      ctx.beginPath();
	      var m = this.measure(ctx, label);
	      ctx.rect(stamplinewidth/2, -40, m.width - stamplinewidth, 80+(stamplinewidth/2), Math.PI*2);
	      ctx.lineWidth = stamplinewidth;
	      ctx.stroke();
	      ctx.closePath();

	      ctx.fillText(label, (m.width - stamplinewidth - tm.width)/2, 20);

	      ctx.restore();
	      return m.width;
    }

    var symbols = function(){
	      var symbols = {};

	      function register(key, draw, measure) {
	          symbols[key] = {draw: draw, measure: measure};
	      }
	      function get() {
	          return symbols;
	      }
	      return {get: get, register: register};
    }();

    function registerStamp(key, label) {
	      symbols.register(key,
			                   function(ctx, x, y){
			                       return drawStamp.apply(this, [ctx, label, x, y]);
			                   },
			                   function(ctx){
			                       return measureStamp(ctx, label);
			                   });
    }

    registerStamp('dnh', 'DNH');
    registerStamp('dohack', 'DO HACK');
    registerStamp('dne', 'DNE');
    symbols.register('person', drawPerson, measureCircle);
    symbols.register('manual', drawManual, measureCircle);

    function drawQRcode(ctx, size, url) {
	      if (qrcode_url !== url) {
	          code = null;
	          qrcode_url = url;
	      }
	      if (code === null) {
	          // calculate the qrcode
            //	    code = new QRCode(-1, QRErrorCorrectLevel.L);
            //	    code = new qrcode(1, 'L');
	          code = new qrcode(4, 'L');
	          code.addData(url);
	          code.make();
	      }

	      ctx.save();
	      var scale = size / (code.getModuleCount()+2);
	      ctx.scale(scale, scale);

	      // draw on the canvas
	      ctx.beginPath();
	      for (var row = 0; row < code.getModuleCount(); row++){
	          for (var col=0; col < code.getModuleCount(); col++){
		            if (code.isDark(row, col)) {
		                ctx.rect(col+1, row+1, 1, 1);
		            }
	          }
	      }
	      ctx.closePath();
	      ctx.fill();
	      ctx.restore();
    }

    function draw(data, preview)
    {
	      var dw;
	      if (preview) {
	          dw = 560;
	      } else {
	          dw = 1083;
	      }
	      var w = 1083;
	      var ds = dw/w;
	      var h = 336;
	      var dh = Math.round(h * ds);
	      var ctx = labitrack.utils.new_context(dw, dh);
	      ctx.scale(ds, ds)

	      ctx.shadowBlur = 0;
	      ctx.globalAlpha = 1.0;

        if(!preview) {
            // make the background white
            ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
            ctx.fillRect(0, 0, dw, dh);
            ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
            // disable smoothing (moz only);
            ctx.mozImageSmoothingEnabled = false;
        }

        // TODO XXX get this url from config file
	      drawQRcode(ctx, h, zero.config.qrcode_base_url+data._id);

	      ctx.translate(h, 0);
	      var y = 50;
	      ctx.font = 'bold 40px sans-serif';
	      ctx.fillText(data.name, 20, y);

        if(data.url) {
	          y += 45;
	          ctx.font = '40px sans-serif';
	          ctx.fillText('url: '+data.url, 20, y);
        }

	      y += 40;
	      ctx.font = 'italic 40px sans-serif';
	      var lines = data.desc.split('\n');
	      for (var i=0; i<lines.length;i++) {
	          ctx.fillText(lines[i], 20, y);
	          y += 40;
	      }

	      function drawline(y, x, w) {
	          ctx.save();
	          ctx.beginPath();
	          ctx.moveTo(x, y);
	          ctx.lineTo(x+w, y);
	          ctx.strokeStyle = 'red 1px';
	          ctx.stroke();
	          ctx.closePath();
	          ctx.restore();
	      }

	      function drawSymbols(ctx) {
            if(!data.tags) {
                return;
            }

	          var l = 20;
	          var r = 750;
	          var y = 280;
	          var p = 15;

	          var tags = data.tags;
	          var syms = symbols.get();
	          for (tag in syms) {

		            var found = false;
		            for (var i=0; i<tags.length; i++) {
		                if (tag === tags[i]) {
			                  found = true;
			                  break;
		                }
		            }
		            if (!found) continue;

		            var sym = syms[tag];

		            var m = sym.measure(ctx);
		            if (m.align === left) {
		                //drawline(y-50-(i*10), l, m.width);
		                l += sym.draw(ctx, l, y) + p;
		            } else {
		                r -= m.width + p;
		                //drawline(y-50-(i*10), r, m.width);
		                sym.draw(ctx, r, y);
		            }
	          }
	      }

	      drawSymbols(ctx);

	      return {
            bitmap: ctx.getImageData(0, 0, dw, dh),
            ctx: ctx
        };
    }

    return draw;

}();
