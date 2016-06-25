(function($){

  "use strict";

  (function ($) {
    "use strict";
    /*jslint browser: true, devel: true, nomen: true, white: true */

    if (!$) {
      console.error('jq.boxy requires jQuery to function!');
      return;
    }

    var defaults = {
      container: $('body'),
      height: 32,
      width: 32,
      strokeWidth: 5,
      strokeColor: '#000',
      highlightColor: '',
      animationDuration: '50'
    }, degrees = function (degree) {
      return (Math.PI / 180) * degree;
    }, createInMemoryCanvas = function (options) {
      var _canvas, _context,
        lineLength = 2 * (options.height + options.width),
        gradient1, gradient2;

      _canvas = document.createElement('canvas');
      _context = _canvas.getContext('2d');
      _canvas.height = parseInt(options.strokeWidth, 10);
      _canvas.width = 2 * lineLength;

      gradient1 = _context.createLinearGradient(0, 0, lineLength, 0);
      gradient1.addColorStop(1, '#fff');
      gradient1.addColorStop(0, '#000');
      gradient2 = _context.createLinearGradient(lineLength, 0, 2 * lineLength, 0);
      gradient2.addColorStop(1, '#fff');
      gradient2.addColorStop(0, '#000');

      _context.beginPath();
      _context.lineWidth = options.strokeWidth;
      _context.moveTo(0, 0);
      _context.lineTo(lineLength, 0);
      _context.strokeStyle = gradient1;
      _context.stroke();

      _context.beginPath();
      _context.moveTo(lineLength, 0);
      _context.lineTo(2 * lineLength, 0);
      _context.strokeStyle = gradient2;
      _context.stroke();

      return _canvas;
    }, drawBox = function (progress, canvas, buffer, options) {
      var context = canvas.getContext('2d'),
        lineLength = 2 * (options.height + options.width),
        lineProgress = parseInt(lineLength * progress, 10);

      context.clearRect(0, 0, canvas.width, canvas.height);

      context.save();
      context.translate(options.width, 0);
      context.rotate(degrees(180));
      context.drawImage(buffer, lineProgress, 0, lineLength / 4, options.strokeWidth, 0, -options.strokeWidth / 2, options.width, options.strokeWidth);
      context.restore();

      context.save();
      context.rotate(degrees(90));
      context.translate(-options.width, 0);
      context.drawImage(buffer, lineProgress + (lineLength / 4), 0, lineLength / 4, options.strokeWidth, options.width, -options.strokeWidth / 2, options.width, options.strokeWidth);
      context.restore();

      context.save();
      context.translate(-options.width, options.height);
      context.drawImage(buffer, lineProgress + (lineLength / 2), 0, lineLength / 4, options.strokeWidth, options.width, -options.strokeWidth / 2, options.width, options.strokeWidth);
      context.restore();

      context.save();
      context.translate(options.width, 0);
      context.rotate(degrees(270));
      context.drawImage(buffer, lineProgress + (lineLength * 0.75), 0, lineLength / 4, options.strokeWidth, -options.width, 0, options.width, options.strokeWidth);
      context.restore();
    }, Boxy = function (options) {
      this.options = $.extend({}, defaults, options);

      this.canvas = document.createElement('canvas');
      this.element = this.canvas;
      this.context = this.canvas.getContext('2d');
      this.canvas.height = 1 * this.options.height;
      this.canvas.width = this.options.width + this.options.strokeWidth;

      this._canvas = createInMemoryCanvas(this.options);
      this._context = this._canvas.getContext('2d');

      this.progress = 0;
    }, testing = false;

    Boxy.enqueueFrame = function (delegate) {
      (window.requestAnimationFrame || function (delegate) { setTimeout(delegate, 0); })(delegate);
    };

    Boxy.prototype.animateFrame = function () {
      drawBox(this.progress / this.options.animationDuration, this.canvas, this._canvas, this.options);

      if (this.isActive === true) {
        Boxy.enqueueFrame($.proxy(this.animateFrame, this));
      }

      this.progress = (this.progress + 1) % this.options.animationDuration;
    };

    Boxy.prototype.start = function () {
      this.isActive = true;
      this.animateFrame();
      return this;
    };

    Boxy.prototype.stop = function () {
      this.isActive = false;
      return this;
    };

    Boxy.prototype.restart = function () {
      this.stop();
      this.start();
      return this;
    };

    Boxy.prototype.isActive = false;

    // For testing
    if (testing) {
      $(function () {
        $('body').empty();
        var boxy = new Boxy({ strokeWidth: '5' });
        boxy.start();
        $('body').prepend(boxy.canvas);
      });
    }

    window.Boxy = Boxy;

  }(jQuery));


  var currLoader = null;
  $.pageLoader = function(option){
    // add the overlay with loading image to the page
    if(option!=='hide'){
      currLoader = currLoader || $('<div id="overlayLoader">');
      currLoader.css({position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
        background: '#fff',
        'z-index': 2001,
        opacity: 0.8,
        filter: "alpha(opacity=80)"});
      var b = new Boxy({strokeColor: "#000"});
      $(b.canvas).css({height: '32px',
        width: '37px',
        position: 'absolute',
        top: '50%',
        left: '50%',
        margin: '-16px 0 0 -18px'});
      currLoader.html(b.canvas);
      b.start();
    }
    else{
      currLoader.remove();
      currLoader = null;
    }
    $(currLoader).appendTo('body');
  };
}(jQuery));
