
var Io = require('legion-io');
var instrument = require('../src/index');
var metrics = require('legion-metrics');

describe('The auto instrument function', function() {
  it('wraps an arbitrary function as a Legion Io runnable', function(done) {
    var returnFive = function() { return 5; };
    returnFive = instrument(returnFive);

    returnFive().run(metrics.Target.create(metrics.merge).receiver()).then(function(result) {
      expect(result).toBe(5);
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });

  it('wraps a Legion Io runnable as a Legion Io runnable', function(done) {
    var returnFive = function() { return 5; };
    returnFive = Io.of().chain(returnFive);
    returnFive = instrument(returnFive);

    returnFive().run(metrics.Target.create(metrics.merge).receiver()).then(function(result) {
      expect(result).toBe(5);
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });

  it('provides the embedded state to any nested Ios', function(done) {
    var getit = instrument(Io.get());

    getit().run(metrics.Target.create(metrics.merge).receiver()).then(function(result) {
      expect(metrics.Target.isReceiver(result)).toBe(true);
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });

  it('measures the time it takes an operation to succeed', function(done) {
    var returnOnDelay = function() {
      return new Promise(function(resolve) {
        setTimeout(function() { resolve(5); }, 2000);
      });
    };

    returnOnDelay = instrument(returnOnDelay);

    var target = metrics.Target.create(metrics.merge);

    returnOnDelay().run(target.receiver().tag(function(x) { return x.summarize(); })).then(function(result) {
      expect(result).toBe(5);
      expect(target.get().get('total$sum')).toBeGreaterThan(2000);
      expect(target.get().get('total$sum')).toBeLessThan(3000);
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });

  it('measures the time it takes an operation to fail', function(done) {
    var throwOnDelay = function() {
      return new Promise(function(resolve,reject) {
        setTimeout(function() { reject(new Error('the quick brown fox jumped over the lazy dog')); }, 2000);
      });
    };

    throwOnDelay = instrument(throwOnDelay);

    var target = metrics.Target.create(metrics.merge);

    throwOnDelay().run(target.receiver().tag(function(x) { return x.summarize(); })).then(function(result) {
      done.fail(result);
    }).catch(function(err) {
      expect(err.message).toBe('the quick brown fox jumped over the lazy dog');
      expect(target.get().get('total$sum')).toBeGreaterThan(2000);
      expect(target.get().get('total$sum')).toBeLessThan(3000);
      done();
    });
  });

  it('demands a MetricsReceiver as the state carried by the Io', function(done) {
    var iDontCare = function() {
      return Promise.resolve('whatever');
    };

    iDontCare = instrument(iDontCare);

    iDontCare().run('unhelpful value that is not even remotely close to being a MetricsReceiver').then(function(result) {
      done.fail(result);
    }).catch(function() {
      done();
    });
  });

  it('supports tagging', function(done) {
    var iDontCare = function() {
      return Promise.resolve('whatever');
    };

    iDontCare = instrument(iDontCare, metrics.tags.protocol('foo'));

    var target = metrics.Target.create(metrics.merge);
    
    iDontCare().run(target.receiver()).then(function() {
      expect(target.get().get('tags').get('protocol').get('foo').get('count$sum')).toBe(1);
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });
});
