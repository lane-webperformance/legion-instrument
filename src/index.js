'use strict';

const Io = require('legion-io');
const metrics = require('legion-metrics');

module.exports = function(fn, tags) {
  return Io.get().chain(metrics_receiver => {
    if( !metrics.Target.isReceiver(metrics_receiver) )
      throw new Error('Io this context is not a MetricsReceiver: ' + metrics_receiver);

    if( typeof tags !== 'undefined' )
      metrics_receiver = metrics_receiver.tag(tags);

    const begin = Date.now();

    return Io.of().chain(fn)
      .chain(result => {
        const end = Date.now();
        metrics_receiver.tag(metrics.tags.outcome.success).receive(metrics.sample({
          duration: metrics.sample.duration(end-begin),
          beginning_timestamp: metrics.sample.timestamp(begin),
          ending_timestamp: metrics.sample.timestamp(end)
        }));
        return Io.of(result);
      }).catch(problem => {
        const end = Date.now();
        metrics_receiver.tag(metrics.tags.outcome.failure).receive(metrics.sample({
          duration: metrics.sample.duration(end-begin),
          beginning_timestamp: metrics.sample.timestamp(begin),
          ending_timestamp: metrics.sample.timestamp(end)
        }));
        throw problem;
      });
  });
};

module.exports.byTags = function(tags) {
  return fn => module.exports(fn,tags);
};

module.exports.wrap = function(fn, tags) {
  return function() {
    return module.exports(() => fn.apply(this,arguments), tags);
  };
};
