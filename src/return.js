'use strict';

const OUTCOMES = {
  success: 'success',
  failure: 'failure',
  timeout: 'timeout'
};

const RETURN = {
  type: 'legion-instrument/instrumented-return-value',
  legion_instrumented_return_value: undefined,
  legion_instrumented_sample_data: {},
  legion_instrumented_outcome: OUTCOMES.success
};

module.exports = function(value, sample_data) {
  return Object.assign(Object.create(RETURN), {
    legion_instrumented_return_value: value,
    legion_instrumented_sample_data: sample_data
  });
};

function withOutcome(outcome) {
  return function(value, sample_data) {
    return Object.assign(this(value, sample_data), {
      legion_instrumented_outcome: outcome
    });
  };
}

module.exports[OUTCOMES.success] = withOutcome(OUTCOMES.success);
module.exports[OUTCOMES.failure] = withOutcome(OUTCOMES.failure);
module.exports[OUTCOMES.timeout] = withOutcome(OUTCOMES.timeout);

module.exports.getReturnValue = function(something) {
  if( something && something.type === RETURN.type )
    return something.legion_instrumented_return_value;

  return something;
};

module.exports.getSampleData = function(something) {
  if( something && something.type === RETURN.type )
    return something.legion_instrumented_sample_data;

  return {};
};

module.exports.getOutcome = function(something, default_outcome) {
  if( something && something.type === RETURN.type )
    return something.legion_instrumented_outcome;

  return default_outcome || OUTCOMES.success;
};

