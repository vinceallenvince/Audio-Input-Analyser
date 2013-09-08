/**
 * PubSub namespace.
 * @namespace
 */
var PubSub = {};

/**
 * Subscribes a callback to an event.
 * @function subscribe
 * @memberof PubSub
 * @param {string} ev An event type.
 * @param {Function} callback A function to call when the event is published.
 */
PubSub.subscribe = function (ev, callback) {
  // Create _callbacks object, unless it already exists
  var calls = this._callbacks || (this._callbacks = {});

  // Create an array for the given event key, unless it exists, then
  // append the callback to the array
  (this._callbacks[ev] || (this._callbacks[ev] = [])).push(callback);
  return this;
};

/**
 * Publishes an event. Subscribed callbacks will be invoked. Pass an event
 * name as the first argument. All other arguments will be passed to all
 * invoked callbacks.
 * @function publish
 * @memberof PubSub
 */
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
