'use strict';

const Io = require('legion-io');
const metrics = require('legion-metrics');

module.exports = function(fn, tags) {
  return Io.get().chain(metrics_receiver => {
    if( !metrics.Target.isReceiver(metrics_receiver) )
      throw new Error('Io this context is not a MetricsReceiver: ' + metrics_receiver);

    if( typeof tags !== 'undefined' )
      metrics_receiver = metrics_receiver.tag(tags);

    const start = Date.now();

    return Io.of().chain(fn)
      .chain(result => {
        metrics_receiver.tag(metrics.tags.outcome.success).receive(metrics.sample({ duration: {
          value: Date.now() - start,
          unit: 'milliseconds',
          interpretation: 'The time needed to complete an operation.' }}));
        return Io.of(result);
      }).catch(problem => {
        metrics_receiver.tag(metrics.tags.outcome.failure).receive(metrics.sample({ duration: {
          value: Date.now() - start,
          unit: 'milliseconds',
          interpretation: 'The time needed to complete an operation.' }}));
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
