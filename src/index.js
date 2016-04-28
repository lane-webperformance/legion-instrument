
var Io = require('legion-io');
var metrics = require('legion-metrics');

function instrumentFunction(fn, tags) {
  return function() {
    var delayed_arguments = arguments;

    return Io.get().chain(function(metrics_receiver) {
      if( !metrics.Target.isReceiver(metrics_receiver) )
        throw new Error('Io this context is not a MetricsReceiver: ' + metrics_receiver);

      if( typeof tags !== 'undefined' )
        metrics_receiver = metrics_receiver.tag(tags);

      var start = Date.now();

      return Promise.resolve(fn.apply(this,delayed_arguments)).then(function(result) {
        metrics_receiver.tag(metrics.tags.outcome.success).receive(metrics.sample(Date.now() - start));
        return result;
      }).catch(function(problem) {
        metrics_receiver.tag(metrics.tags.outcome.failure).receive(metrics.sample(Date.now() - start));
        throw problem;
      });
    });
  };
}

function instrumentIo(io, tags) {
  return function() {
    return Io.get().chain(instrumentFunction(io.unwrap(), tags));
  };
}

module.exports = function(fn, tags) {
  if( Io.isIo(fn) )
    return instrumentIo(fn, tags);
  else
    return instrumentFunction(fn, tags);
};
