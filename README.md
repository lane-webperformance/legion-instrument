
Measure the running time and success rate of any function that returns a
promise.

	var instrument = require('legion-instrument');

instrument(fn, tags)
--------------------

Returns an [Io](https://github.com/lane-webperformance/legion-io) that wraps
the specified function. When calling Io.run(), the carried state must be a
[MetricsReceiver](https://github.com/lane-webperformance/legion-metrics).

* fn: any function that returns a promise, or another Io.
* tags: an array of any
[tags](https://github.com/lane-webperformance/legion-metrics).

