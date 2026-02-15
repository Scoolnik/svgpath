'use strict';


import { describe, assert, it } from 'vitest';
import path from 'node:path';
import { readFileSync } from 'node:fs';

import svgpath from '..';

describe('Path parse', function () {

  it('big batch', function () {
    var batch = readFileSync(path.join(__dirname, '/fixtures/big.txt'), 'utf8').split(/[\r\n]/);

    for (var i = 0; i < batch.length; i++) {
      if (!batch[i]) { continue; }
      assert.strictEqual(batch[i], new svgpath(batch[i]).toString());
    }
  });


  it('empty string', function () {
    assert.strictEqual(new svgpath('').toString(), '');
  });


  it('line terminators', function () {
    assert.strictEqual(new svgpath('M0\r 0\n\u1680l2-3\nz').toString(), 'M0 0l2-3z');
  });


  it('params formats', function () {
    assert.strictEqual(new svgpath('M 0.0 0.0').toString(),  'M0 0');
    assert.strictEqual(new svgpath('M 1e2 0').toString(),    'M100 0');
    assert.strictEqual(new svgpath('M 1e+2 0').toString(),   'M100 0');
    assert.strictEqual(new svgpath('M +1e+2 0').toString(),  'M100 0');
    assert.strictEqual(new svgpath('M 1e-2 0').toString(),   'M0.01 0');
    assert.strictEqual(new svgpath('M 0.1e-2 0').toString(), 'M0.001 0');
    assert.strictEqual(new svgpath('M .1e-2 0').toString(),  'M0.001 0');
    assert.strictEqual(new svgpath('M0.6.5').toString(),     'M0.6 0.5');
  });

  it('repeated', function () {
    assert.strictEqual(new svgpath('M 0 0 100 100').toString(),  'M0 0L100 100');
    assert.strictEqual(new svgpath('m 0 0 100 100').toString(),  'M0 0l100 100');
  });

  it('arc flags', function () {
    assert.strictEqual(
      new svgpath('M 0 0 a.625.625 0 01.84-.925').toString(),
      'M0 0a0.625 0.625 0 0 1 0.84-0.925'
    );
  });

  it('errors', function () {
    assert.strictEqual(new svgpath('0').err, 'SvgPath: bad command 0 (at pos 0)');
    assert.strictEqual(new svgpath('U').err, 'SvgPath: bad command U (at pos 0)');
    assert.strictEqual(new svgpath('M0 0G 1').err, 'SvgPath: bad command G (at pos 4)');
    assert.strictEqual(new svgpath('z').err, 'SvgPath: string should start with `M` or `m`');
    // assert.strictEqual(new svgpath('M0 0a2 2 2 2 2 2 2').err, 'SvgPath: arc flag can be 0 or 1 only (at pos 11)');
    // assert.strictEqual(new svgpath('M+').err, 'SvgPath: param should start with 0..9 or `.` (at pos 2)');
    // assert.strictEqual(new svgpath('M00').err, 'SvgPath: numbers started with `0` such as `09` are illegal (at pos 1)');
    // assert.strictEqual(new svgpath('M0e').err, 'SvgPath: invalid float exponent (at pos 3)');
    // assert.strictEqual(new svgpath('M0').err, 'SvgPath: missed param (at pos 2)');
    // assert.strictEqual(new svgpath('M0,0,').err, 'SvgPath: missed param (at pos 5)');
    // assert.strictEqual(new svgpath('M0 .e3').err, 'SvgPath: invalid float exponent (at pos 4)');
  });

  it('keeps valid commands', function () {
    assert.strictEqual(new svgpath('M0 0G 1').toString(), 'M0 0');
    assert.strictEqual(new svgpath('z').toString(), '');
    assert.strictEqual(new svgpath('M0 0L+').toString(), 'M0 0');
    assert.strictEqual(new svgpath('M0 0L00').toString(), 'M0 0');
    assert.strictEqual(new svgpath('M0 0L0e').toString(), 'M0 0');
    assert.strictEqual(new svgpath('M0 0L0').toString(), 'M0 0');
    assert.strictEqual(new svgpath('M0,0,').toString(), 'M0 0');
    assert.strictEqual(new svgpath('M0 0L0 .e3').toString(), 'M0 0');
    assert.strictEqual(new svgpath('M0 0a2 2 2 2 2 2 2').toString(), 'M0 0');
  });
});
