
[![Build Status](https://travis-ci.org/lane-webperformance/legion-instrument.svg?branch=master)](https://travis-ci.org/lane-webperformance/legion-instrument)
[![Dependency Status](https://gemnasium.com/badges/github.com/lane-webperformance/legion-instrument.svg)](https://gemnasium.com/github.com/lane-webperformance/legion-instrument)

Measure the running time and success rate of any function that returns a
promise.

	var instrument = require('legion-instrument');

instrument(fn, tags)
--------------------

* fn: any function that returns a promise. Also accepted: a function that returns a plain value, a function that returns an Io, or an Io.
* tags: an array of any [tags](https://github.com/lane-webperformance/legion-metrics).

Returns an [Io](https://github.com/lane-webperformance/legion-io)
that executes the given function while measuring its running time
and success rate. The carried state of the Io must include a
[MetricsReceiver](https://github.com/lane-webperformance/legion-metrics)
in the state.services.metrics field.

instrument.return(value, sample\_data)
--------------------------------------

Use this method to return extra sample data from an instrumented
function. As an example:

	function foo() {
	  return asyncLoadResource().then(result => {
            var custom_metrics = {
              resource_size: {
                value: result.size,
                unit: 'bytes',
                interpretation: 'Size of the resource.'
              }
            };

            if( result.status === 'ok' )
              return instrument.return(result, custom_metrics);
            else
              return instrument.return.failure(result, custom_metrics);
          });
	}

Use of this mechanism is optional. It's also possible to throw
a failure or a timeout:

	throw instrument.return.failure(new Error('something bad happened'), custom_metrics);

instrument.return.success(value, sample\_data)
----------------------------------------------

Alias of instrument.return.

instrument.return.failure(value, sample\_data)
----------------------------------------------

As instrument.return, but will be recorded as a failure. This can wrap 
either an exception or a return value.

Use of this mechanism is optional.

instrument.return.timeout(value, sample\_data)
----------------------------------------------

As instrument.return, but will be recorded as a timeout condition, (which is treated
as separate from a success or failure).

Use of this mechanism is optional.

instrument.byTags(tags)
-----------------------

Returns a function that instruments other functions with the given
tags. The following are equivalent:

	instrument(fn, tags)

	instrument.byTags(tags)(fn)

instrument.wrap(fn,tags)
------------------------

Works exactly like instrument(fn,tags), except the result is a function,
not an Io, which may be called with same parameters as the original. This
is a way of quickly converting a promise-based function to work with
Legion.

instrument.wrapAll(obj,tags)
----------------------------

Wraps all methods of an object, returning a new object. Any member of the
input that is not a function will be shallow-copied as-is.

This may be a fast way to convert a large promise-based API to play well
with Legion.

