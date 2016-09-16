'use strict';

const Io = require('legion-io');
const instrument = require('../src/index');
const metrics = require('legion-metrics');

describe('The auto instrument function', function() {
  it('wraps an arbitrary function as a Legion Io runnable', function(done) {
    let returnFive = function() { return 5; };
    returnFive = instrument(returnFive);

    instrument(returnFive).run(metrics.Target.create(metrics.merge).receiver()).then(function(result) {
      expect(result).toBe(5);
      done();
    }).catch(done.fail);
  });

  it('wraps a Legion Io runnable as a Legion Io runnable', function(done) {
    let returnFive = function() { return 5; };
    returnFive = Io.of().chain(returnFive);

    instrument(returnFive).run(metrics.Target.create(metrics.merge).receiver()).then(function(result) {
      expect(result).toBe(5);
      done();
    }).catch(done.fail);
  });

  it('provides the embedded state to any nested Ios', function(done) {
    const getit = instrument(Io.get());

    getit.run(metrics.Target.create(metrics.merge).receiver()).then(function(result) {
      expect(metrics.Target.isReceiver(result)).toBe(true);
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });

  it('measures the time it takes an operation to succeed', function(done) {
    const returnOnDelay = function() {
      return new Promise(function(resolve) {
        setTimeout(function() { resolve(5); }, 2000);
      });
    };

    const target = metrics.Target.create(metrics.merge);

    instrument(returnOnDelay).run(target.receiver().tag(function(x) { return x.summarize(); })).then(function(result) {
      expect(result).toBe(5);
      const metrics = JSON.parse(JSON.stringify(target.get()));
      expect(metrics.values.duration.$avg.avg).toBeGreaterThan(1900);
      expect(metrics.values.duration.$avg.avg).toBeLessThan(2100);
      expect(metrics.values.beginning_timestamp.$avg.avg).toBeGreaterThan(Date.now()-2100);
      expect(metrics.values.beginning_timestamp.$avg.avg).toBeLessThan(Date.now()-1900);
      expect(metrics.values.ending_timestamp.$avg.avg).toBeGreaterThan(Date.now()-100);
      expect(metrics.values.ending_timestamp.$avg.avg).not.toBeGreaterThan(Date.now());
      done();
    }).catch(done.fail);
  });

  it('measures the time it takes an operation to fail', function(done) {
    const throwOnDelay = function() {
      return new Promise(function(_,reject) {
        setTimeout(function() { reject(new Error('the quick brown fox jumped over the lazy dog')); }, 2000);
      });
    };

    const target = metrics.Target.create(metrics.merge);

    instrument(throwOnDelay).run(target.receiver().tag(function(x) { return x.summarize(); }))
      .then(done.fail)
      .catch(function(err) {
        expect(err.message).toBe('the quick brown fox jumped over the lazy dog');
        const metrics = JSON.parse(JSON.stringify(target.get()));
        expect(metrics.values.duration.$avg.avg).toBeGreaterThan(2000);
        expect(metrics.values.duration.$avg.avg).toBeLessThan(2100);
        expect(metrics.values.beginning_timestamp.$avg.avg).toBeGreaterThan(Date.now()-2100);
        expect(metrics.values.beginning_timestamp.$avg.avg).toBeLessThan(Date.now()-1900);
        expect(metrics.values.ending_timestamp.$avg.avg).toBeGreaterThan(Date.now()-100);
        expect(metrics.values.ending_timestamp.$avg.avg).not.toBeGreaterThan(Date.now());
        done();
      })
      .catch(done.fail);
  });

  it('demands a MetricsReceiver as the state carried by the Io', function(done) {
    const iDontCare = function() {
      return Promise.resolve('whatever');
    };

    instrument(iDontCare).run('unhelpful value that is not even remotely close to being a MetricsReceiver').then(function(result) {
      done.fail(result);
    }).catch(function() {
      done();
    });
  });

  it('supports tagging', function(done) {
    let iDontCare = function() {
      return Promise.resolve('whatever');
    };

    iDontCare = instrument(iDontCare, metrics.tags.protocol('foo'));

    const target = metrics.Target.create(metrics.merge);
    
    iDontCare.run(target.receiver()).then(function() {
      const metrics = JSON.parse(JSON.stringify(target.get()));
      expect(metrics.tags.protocol.foo.values.duration.$avg.size).toBe(1);
      done();
    }).catch(done.fail);
  });

  it('supports tagging via the withTags() function', function(done) {
    const iDontCare = function() {
      return Promise.resolve('whatever');
    };

    const fooProtocol = instrument.byTags(metrics.tags.protocol('foo'));

    const target = metrics.Target.create(metrics.merge);
    
    fooProtocol(iDontCare).run(target.receiver()).then(function() {
      const metrics = JSON.parse(JSON.stringify(target.get()));
      expect(metrics.tags.protocol.foo.values.duration.$avg.size).toBe(1);
      done();
    }).catch(done.fail);
  });

  it('supports wrapping functions that accept parameters', function(done) {
    let addable = function(a,b,c,d) {
      return new Promise(function(resolve) {
        setTimeout(function() { resolve(a + d); }, a+b+c+d);
      });
    };

    addable = instrument.wrap(addable);

    const target = metrics.Target.create(metrics.merge);
    
    addable(100,200,300,400).run(target.receiver().tag(x => x.summarize())).then(result => {
      expect(result).toBe(500);
      const metrics = JSON.parse(JSON.stringify(target.get()));
      expect(metrics.values.duration.$avg.avg).toBeGreaterThan(950);
      expect(metrics.values.duration.$avg.avg).not.toBeGreaterThan(1050);
      done();
    }).catch(done.fail);
  });

  it('supports wrapping all methods in an object', function(done) {
    const example = {
      _count : 2,
      inc : function() { return Promise.resolve(this._count++); }
    };

    const wrapped = instrument.wrapAll(example);

    const target = metrics.Target.create(metrics.merge);

    wrapped.inc().chain(wrapped.inc()).run(target.receiver()).then(result => {
      expect(result).toBe(3);
      expect(example._count).toBe(4);
      expect(wrapped._count).toBe(2);
      done();
    }).catch(done.fail);
  });
});
