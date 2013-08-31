navigator.getMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

/**
 * RequestAnimationFrame shim layer with setTimeout fallback
 * @param {function} callback The function to call.
 * @returns {function|Object} An animation frame or a timeout object.
 */
window.requestAnimFrame = (function(callback){

  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(callback) {
            window.setTimeout(callback, 1000 / 60);
          };
})();

/**
 * Creates an audio controller.
 */
function AudioController() {
  this.context = null;
  this.analyser = null;
  this.freqDomain = null;
  this.timeDomain = null;
}

/**
 * Initializes an audio controller.
 */
AudioController.prototype.init = function() {

  if (typeof AudioContext !== 'undefined') {
      this.context = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
      this.context = new webkitAudioContext();
  } else {
      throw new Error('AudioContext not supported. :(');
  }

  if (this.hasGetUserMedia()) {
    navigator.getMedia({audio: true}, this.handleUserMedia.bind(this), this.failUserMedia);
  } else {
    document.body.textContent = 'getUserMedia() is not supported in your browser';
  }
};

/**
 * Handles a successful attempt to get user media.
 * @oaram {Object} stream An audio stream.
 */
AudioController.prototype.handleUserMedia = function(stream) {

  var microphone = this.context.createMediaStreamSource(stream);

  this.analyser = this.context.createAnalyser();

  // microphone -> analyser -> destination.
  microphone.connect(this.analyser);
  this.analyser.connect(this.context.destination);

  this.freqDomain = new Uint8Array(this.analyser.frequencyBinCount);
  this.timeDomain = new Uint8Array(this.analyser.frequencyBinCount);

  this.loop();
};

AudioController.prototype.loop = function() {

  this.analyser.getByteFrequencyData(this.freqDomain);
  this.analyser.getByteTimeDomainData(this.timeDomain);

  exports.PubSub.publish('analyse', {
    frequencyBinCount: this.analyser.frequencyBinCount,
    freqDomain: this.freqDomain,
    timeDomain: this.timeDomain
  });

  requestAnimFrame(this.loop.bind(this));
};

/**
 * Handles failed attempt to get user media.
 * @param {Object} e An event object.
 */
AudioController.prototype.failUserMedia = function(e) {
  document.body.textContent = 'Failed to get user media. ' + e.name;
};

/**
 * Returns the value of a specific frequency.
 * @param {number} frequency An audio frequency.
 * @returns {number} A frequency value.
 */
AudioController.prototype.getFrequencyValue = function(frequency) {
  var nyquist = context.sampleRate / 2;
  var index = Math.round(frequency/nyquist * freqDomain.length);
  return freqDomain[index];
};

/**
 * Checks if browser supports the getUserMedia API. Note: Opera is unprefixed.
 */
AudioController.prototype.hasGetUserMedia = function() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
};