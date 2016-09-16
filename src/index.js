'use strict';

const Io = require('legion-io');
const metrics = require('legion-metrics');

function instrument(fn, tags) {
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
}

module.exports = instrument;

module.exports.byTags = function(tags) {
  return fn => instrument(fn,tags);
};

module.exports.wrap = function(fn, tags) {
  return function() {
    return instrument(() => fn.apply(this,arguments), tags);
  };
};

module.exports.wrapAll = function(obj, tags) {
  const result = {};

  for( const key in obj ) {
    result[key] = typeof obj[key] === 'function' ? instrument.wrap(obj[key], tags).bind(obj) : obj[key];
  }

  return result;
};

