/*! AudioInputAnalyzer v1.0.0 - 2013-08-31 06:08:07 
 *  Vince Allen 
 *  Brooklyn, NY 
 *  vince@vinceallen.com 
 *  @vinceallenvince 
 *  License: MIT */

var AudioInputAnalyzer = {}, exports = AudioInputAnalyzer;

(function(exports) {

"use strict";

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
}

AudioController.prototype.loop = function() {

  this.analyser.getByteFrequencyData(this.freqDomain);
  this.analyser.getByteTimeDomainData(this.timeDomain);

  exports.PubSub.publish('analyse', {
    frequencyBinCount: this.analyser.frequencyBinCount,
    freqDomain: this.freqDomain,
    timeDomain: this.timeDomain
  });

  requestAnimFrame(this.loop.bind(this));
}

/**
 * Handles failed attempt to get user media.
 * @param {Object} e An event object.
 */
AudioController.prototype.failUserMedia = function(e) {
  document.body.textContent = 'Failed to get user media. ' + e.name;
}

/**
 * Returns the value of a specific frequency.
 * @param {number} frequency An audio frequency.
 * @returns {number} A frequency value.
 */
AudioController.prototype.getFrequencyValue = function(frequency) {
  var nyquist = context.sampleRate / 2;
  var index = Math.round(frequency/nyquist * freqDomain.length);
  return freqDomain[index];
}

/**
 * Checks if browser supports the getUserMedia API. Note: Opera is unprefixed.
 */
AudioController.prototype.hasGetUserMedia = function() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}
exports.AudioController = AudioController;

var PubSub = {};

PubSub.subscribe = function (ev, callback) {
  // Create _callbacks object, unless it already exists
  var calls = this._callbacks || (this._callbacks = {});

  // Create an array for the given event key, unless it exists, then
  // append the callback to the array
  (this._callbacks[ev] || (this._callbacks[ev] = [])).push(callback);
  return this;
};

PubSub.publish = function () {
  // Turn arguements into a real array
  var args = Array.prototype.slice.call(arguments, 0);

  // Extract the first argument, the event name
  var ev = args.shift();

  // Return if there isn't a _callbacks object, or
  // if it doesn't contain an array for the given event
  var list, calls, i, l;
  if (!(calls = this._callbacks)) {
    return this;
  }
  if (!(list = this._callbacks[ev])) {
    return this;
  }

  // Invoke the callbacks
  for (i = 0, l = list.length; i < l; i += 1) {
    list[i].apply(this, args);
  }
  return this;
};

exports.PubSub = PubSub;

}(exports));