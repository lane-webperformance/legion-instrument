'use strict';

const instrument = require('../src/index');

describe('The instrumented return function', function() {
  it('returns a value with extra sample data', function() {
    const result = instrument.return('the quick brown fox', { foo: 'bar' });

    expect(instrument.return.getReturnValue(result)).toBe('the quick brown fox');
    expect(instrument.return.getSampleData(result)).toEqual({ foo: 'bar' });
    expect(instrument.return.getOutcome(result)).toBe('success');
  });

  it('unwraps values whether they were wrapped in the first place or just raw values', function() {
    const result = 'the quick brown fox';

    expect(instrument.return.getReturnValue(result)).toBe('the quick brown fox');
    expect(instrument.return.getSampleData(result)).toEqual({});
    expect(instrument.return.getOutcome(result)).toBe('success');
  });
});
