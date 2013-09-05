navigator.getMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

window.AudioContextClass = (window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext ||
    window.msAudioContext);

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
 * Typical frequencies in a 10-band spectrum.
 */
var BAND10 = [
  31, 63, 125, 250, 500,
  1000, 2000, 4000, 8000, 16000
];

/**
 * Typical frequencies in a 31-band spectrum.
 */
var BAND31 = [
  20, 25, 31, 40, 50, 63, 80, 100, 126, 160,
  201, 253, 320, 403, 507, 640, 806, 1000, 1300, 1600,
  2000, 2500, 3200, 4000, 5100, 6400, 8100, 10000, 13000, 16000,
  20000
];

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
 * Re-maps a number from one range to another.
 *
 * @param {number} value The value to be converted.
 * @param {number} min1 Lower bound of the value's current range.
 * @param {number} max1 Upper bound of the value's current range.
 * @param {number} min2 Lower bound of the value's target range.
 * @param {number} max2 Upper bound of the value's target range.
 * @returns {number} A number.
 */
AudioController.prototype.map = function(value, min1, max1, min2, max2) {
  var unitratio = (value - min1) / (max1 - min1);
  return (unitratio * (max2 - min2)) + min2;
};

/**
 * Initializes an audio controller.
 */
AudioController.prototype.init = function() {

  if (this.hasWebAudio()) {
    this.context = new window.AudioContextClass();
  } else {
    throw new Error('Web Audio API is not supported in your browser.');
  }

  if (this.hasGetUserMedia()) {
    navigator.getMedia({audio: true}, this.handleUserMedia.bind(this), this.failUserMedia);
  } else {
    throw new Error('getUserMedia() is not supported in your browser.');
  }
};

/**
 * Handles a successful attempt to get user media.
 * @oaram {Object} stream An audio stream.
 */
AudioController.prototype.handleUserMedia = function(stream) {

  // create stream source
  this.microphone = this.context.createMediaStreamSource(stream);

  /*
   * Creates a javascriptnode that is called whenever the 2048 frames have been sampled.
   * Our data is sampled at 44.1k. Function will be called approximately 21 times a second.
   */
  this.meter = this.context.createJavaScriptNode(2048, 2, 2); // buffer size, the number of input channels, the number of output channels
  this.meter.onaudioprocess = this.processAudio.bind(this);
  this.meter.connect(this.context.destination);

  // create analysers
  this.analyser1 = this.context.createAnalyser();
  this.analyser1.smoothingTimeConstant = 0.3;
  this.analyser1.fftSize = 512;

  this.analyser2 = this.context.createAnalyser();
  this.analyser2.smoothingTimeConstant = 0.3;
  this.analyser2.fftSize = 512;

  // create splitter
  this.splitter = this.context.createChannelSplitter(2);

  // connect microphone -> splitter -> analysers -> meter.
  this.microphone.connect(this.splitter);
  this.splitter.connect(this.analyser1, 0, 0);
  this.splitter.connect(this.analyser2, 1, 0);
  this.analyser1.connect(this.meter);

  /*
   * BE CAREFUL: connecting microphone to destination may create feedback.
   * Mute your speakers first.
   */
  // this.microphone.connect(this.context.destination);

};

/**
 * Handles audio processing event.
 * @param {Object} e An event object.
 */
AudioController.prototype.processAudio = function(e) {

  var i, channelLevel1, channelLevel2, averageVol1, averageVol2,
      channelData1 = e.inputBuffer.getChannelData(0),
      channelData2 = e.inputBuffer.getChannelData(1),
      freqDomain1 = new Uint8Array(this.analyser1.frequencyBinCount),
      freqDomain2 = new Uint8Array(this.analyser2.frequencyBinCount),
      timeDomain1 = new Uint8Array(this.analyser1.frequencyBinCount),
      timeDomain2 = new Uint8Array(this.analyser2.frequencyBinCount),
      BAND10Array1 = [], BAND10Array2 = [], BAND31Array1 = [], BAND31Array2 = [];

  channelLevel1 = this.getArrayAbsoluteAverage(channelData1);
  channelLevel2 = this.getArrayAbsoluteAverage(channelData2);

  this.analyser1.getByteFrequencyData(freqDomain1);
  averageVol1 = this.getArrayAverage(freqDomain1);

  this.analyser2.getByteFrequencyData(freqDomain2);
  averageVol2 = this.getArrayAverage(freqDomain2);

  this.analyser1.getByteTimeDomainData(timeDomain1);
  this.analyser2.getByteTimeDomainData(timeDomain2);

  BAND10Array1 = this.createBandArray(BAND10, freqDomain1);
  BAND31Array1 = this.createBandArray(BAND31, freqDomain1);

  BAND10Array2 = this.createBandArray(BAND10, freqDomain2);
  BAND31Array2 = this.createBandArray(BAND31, freqDomain2);

  exports.PubSub.publish('meter', {
    channelLevel1: channelLevel1,
    channelLevel2: channelLevel2,
    averageVol1: averageVol1,
    averageVol2: averageVol2,
    freqDomain1: freqDomain1,
    freqDomain2: freqDomain2,
    timeDomain1: timeDomain1,
    timeDomain2: timeDomain2,
    BAND10Array1: BAND10Array1,
    BAND10Array2: BAND10Array2,
    BAND31Array1: BAND31Array1,
    BAND31Array2: BAND31Array2
  });
};

AudioController.prototype.createBandArray = function(bandArray, freqDomain) {

  var i, arr = [];

  for (i = 0; i < bandArray.length; i++) {
    arr.push(this.getFrequencyValue(bandArray[i], freqDomain));
  }
  return arr;
};

/**
 * Returns an average based on all values in the passed array.
 */
AudioController.prototype.getArrayAverage = function(array) {

  var i, max, values = 0;

  for (i = 0, max = array.length; i < max; i++) {
      values += array[i];
  }
  return values / max;
};

/**
 * Returns an average based on all absolute values in the passed array.
 */
AudioController.prototype.getArrayAbsoluteAverage = function(array) {

  var i, max, values = 0;

  for (i = 0, max = array.length; i < max; i++) {
      values += Math.abs(array[i]);
  }
  return values / max;
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
 * @param {Array.<Object>} frequency A frequency domain.
 * @returns {number} A frequency value.
 */
AudioController.prototype.getFrequencyValue = function(frequency, freqDomain) {
  var nyquist = this.context.sampleRate / 2;
  var index = Math.round(frequency/nyquist * freqDomain.length);
  return freqDomain[index];
};

/**
 * Checks if browser supports the Web Audio API.
 */
AudioController.prototype.hasWebAudio = function() {
  return !!(window.AudioContext || window.webkitAudioContext ||
            window.mozAudioContext || window.oAudioContext || window.msAudioContext);
};

/**
 * Checks if browser supports the getUserMedia API. Note: Opera is unprefixed.
 */
AudioController.prototype.hasGetUserMedia = function() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
};

/**
 * Determines the size of the browser window.
 *
 * @returns {Object} The current browser window width and height.
 * @private
 */
AudioController.prototype.getViewportSize = function() {

  var d = {
    'width' : undefined,
    'height' : undefined
  };

  if (typeof(window.innerWidth) !== 'undefined') {
    d.width = window.innerWidth;
    d.height = window.innerHeight;
  } else if (typeof(document.documentElement) !== 'undefined' &&
      typeof(document.documentElement.clientWidth) !== 'undefined') {
    d.width = document.documentElement.clientWidth;
    d.height = document.documentElement.clientHeight;
  } else if (typeof(document.body) !== 'undefined') {
    d.width = document.body.clientWidth;
    d.height = document.body.clientHeight;
  }
  return d;
};