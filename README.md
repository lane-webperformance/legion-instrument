
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

