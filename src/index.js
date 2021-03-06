'use strict';

const Io = require('legion-io');
const metrics = require('legion-metrics');
const instReturn = require('./return');

function instrument(fn, tags) {
  return Io.get().chain(services => {
    if( tags )
      services = services.tag(tags);

    const begin = Date.now();
    const conclude = (result, default_outcome) => {
      const end = Date.now();
      const outcome = instReturn.getOutcome(result, default_outcome);

      if( outcome !== 'success' )
        services.incrementProblems();

      services.tag(metrics.tags.outcome[outcome]).receive(metrics.sample(Object.assign({
        duration: metrics.sample.duration(end-begin),
        beginning_timestamp: metrics.sample.timestamp(begin),
        ending_timestamp: metrics.sample.timestamp(end)
      }, instReturn.getSampleData(result))));
      return Io.of(instReturn.getReturnValue(result));
    };

    return Io.of().chain(fn)
      .catch(except => conclude(except,'failure').chain(x => { throw x; }))
      .chain(result => conclude(result,'success'));
  });
}

module.exports = instrument;

module.exports.return = instReturn;

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

