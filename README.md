
[![Build Status](https://travis-ci.org/lane-webperformance/legion-instrument.svg?branch=master)](https://travis-ci.org/lane-webperformance/legion-instrument)
[![Dependency Status](https://gemnasium.com/badges/github.com/lane-webperformance/legion-instrument.svg)](https://gemnasium.com/github.com/lane-webperformance/legion-instrument)

Measure the running time and success rate of any function that returns a
promise.

	var instrument = require('legion-instrument');

instrument(fn, tags)
--------------------

Returns a function that accepts exactly the same arguments as fn.

The wrapped function returns an
[Io](https://github.com/lane-webperformance/legion-io), allowing
the run time of the operation to be measured ("instrumented").
When calling Io.run(), the carried state must be a
[MetricsReceiver](https://github.com/lane-webperformance/legion-metrics).

* fn: any function that returns a promise. fn might also be an Io.
* tags: an array of any
[tags](https://github.com/lane-webperformance/legion-metrics).

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

