
var patchwork = require('../utils/patchwork.js');

var ErrorWrapper = function(opts) {
  var pmx = require('../..');

  var Probe = pmx.probe();

  global.__km_error_rate = Probe.meter({
    name : 'new Error',
    samples : 60
  });

  Object.defineProperty(global, 'OriginalError', {
    configurable: true,
    value: global.Error
  });

  Object.defineProperty(global, 'Error', {
    configurable: true,
    value: patchwork(Error, {
      constructorMethod: function () {
        global.__km_error_rate.mark();
      }
    })
  });

  console.log('Patched Error');
};

module.exports = ErrorWrapper;