// SVG Path transformations library
//
// Usage:
//
//    SvgPath('...')
//      .translate(-150, -100)
//      .scale(0.5)
//      .translate(-150, -100)
//      .toFixed(1)
//      .toString()
//

'use strict';


var pathParse      = require('./path_parse');
var transformParse = require('./transform_parse');
var matrix         = require('./matrix');
var a2c            = require('./a2c');
var ellipse        = require('./ellipse');


// Class constructor
//
function SvgPath(path) {
  if (!(this instanceof SvgPath)) { return new SvgPath(path); }

  var pstate = pathParse(path);

  // Array of path segments.
  // Each segment is array [type, param1, param2, ...]
  this.segments = pstate.segments;

  // Error message on parse error.
  this.err      = pstate.err;

  // Transforms stack for lazy evaluation
  this.__stack    = [];
}

SvgPath.from = function (src) {
  if (typeof src === 'string') return new SvgPath(src);

  if (src instanceof SvgPath) {
    // Create empty object
    var s = new SvgPath('');

    // Clone properies
    s.err = src.err;
    s.segments = src.segments.map(function (sgm) { return { type: sgm.type, values: [...sgm.values] } });
    s.__stack = src.__stack.map(function (m) {
      return matrix().matrix(m.toArray());
    });

    return s;
  }

  throw new Error('SvgPath.from: invalid param type ' + src);
};


SvgPath.prototype.__matrix = function (m) {
  var self = this, i;

  // Quick leave for empty matrix
  if (!m.queue.length) { return; }

  this.iterate(function (s, index, x, y) {
    var p, result, name, isRelative;
    var values = s.values;

    switch (s.type) {

      // Process 'assymetric' commands separately
      case 'v':
        p      = m.calc(0, values[0], true);
        result = (p[0] === 0) ? { type: 'v', values: [ p[1] ] } : { type: 'l', values: [ p[0], p[1] ] };
        break;

      case 'V':
        p      = m.calc(x, values[0], false);
        result = (p[0] === m.calc(x, y, false)[0]) ? { type: 'V', values: [ p[1] ] } : { type: 'L', values: [ p[0], p[1] ] };
        break;

      case 'h':
        p      = m.calc(values[0], 0, true);
        result = (p[1] === 0) ? { type: 'h', values: [ p[0] ] } : { type: 'l', values: [ p[0], p[1] ] };
        break;

      case 'H':
        p      = m.calc(values[0], y, false);
        result = (p[1] === m.calc(x, y, false)[1]) ? { type: 'H', values: [ p[0] ] } : { type: 'L', values: [ p[0], p[1] ] };
        break;

      case 'a':
      case 'A':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]

        // Drop segment if arc is empty (end point === start point)
        /*if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
            (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
          return [];
        }*/

        // Transform rx, ry and the x-axis-rotation
        var ma = m.toArray();
        var e = ellipse(values[0], values[1], values[2]).transform(ma);

        // flip sweep-flag if matrix is not orientation-preserving
        if (ma[0] * ma[3] - ma[1] * ma[2] < 0) {
          values[4] = values[4] ? '0' : '1';
        }

        // Transform end point as usual (without translation for relative notation)
        p = m.calc(values[5], values[6], s.type === 'a');

        // Empty arcs can be ignored by renderer, but should not be dropped
        // to avoid collisions with `S A S` and so on. Replace with empty line.
        if ((s.type === 'A' && values[5] === x && values[6] === y) ||
            (s.type === 'a' && values[5] === 0 && values[6] === 0)) {
          result = { type: s.type === 'a' ? 'l' : 'L', values: [ p[0], p[1] ] };
          break;
        }

        // if the resulting ellipse is (almost) a segment ...
        if (e.isDegenerate()) {
          // replace the arc by a line
          result = { type: s.type === 'a' ? 'l' : 'L', values: [ p[0], p[1] ] };
        } else {
          // if it is a real ellipse
          // type name, s[3] and s[4] are not modified
          result = { type: s.type, values: [ e.rx, e.ry, e.ax, values[3], values[4], p[0], p[1] ] };
        }

        break;

      case 'm':
        // Edge case. The very first `m` should be processed as absolute, if happens.
        // Make sense for coord shift transforms.
        isRelative = index > 0;

        p = m.calc(values[0], values[1], isRelative);
        result = { type: 'm', values: [ p[0], p[1] ] };
        break;

      default:
        name       = s.type;
        result     = { type: name, values: [] };
        isRelative = (name.toLowerCase() === name);

        // Apply transformations to the segment
        for (i = 0; i < values.length; i += 2) {
          p = m.calc(values[i], values[i + 1], isRelative);
          result.values.push(p[0], p[1]);
        }
    }

    self.segments[index] = result;
  }, true);
};


// Apply stacked commands
//
SvgPath.prototype.__evaluateStack = function () {
  var m, i;

  if (!this.__stack.length) { return; }

  if (this.__stack.length === 1) {
    this.__matrix(this.__stack[0]);
    this.__stack = [];
    return;
  }

  m = matrix();
  i = this.__stack.length;

  while (--i >= 0) {
    m.matrix(this.__stack[i].toArray());
  }

  this.__matrix(m);
  this.__stack = [];
};


// Convert processed SVG Path back to string
//
SvgPath.prototype.toString = function () {
  var result = '', prevCmd = '', cmdSkipped = false;

  this.__evaluateStack();

  for (var i = 0, len = this.segments.length; i < len; i++) {
    var segment = this.segments[i];
    var cmd = segment.type;
    var values = segment.values;

    // Command not repeating => store
    if (cmd !== prevCmd || cmd === 'm' || cmd === 'M') {
      // workaround for FontForge SVG importing bug, keep space between "z m".
      if (cmd === 'm' && prevCmd === 'z') result += ' ';
      result += cmd;

      cmdSkipped = false;
    } else {
      cmdSkipped = true;
    }

    // Store segment params
    for (var pos = 0; pos < values.length; pos++) {
      var val = values[pos];
      // Space can be skipped
      // 1. After command (always)
      // 2. For negative value (with '-' at start)
      if (pos === 0) {
        if (cmdSkipped && val >= 0) result += ' ';
      } else if (val >= 0) result += ' ';

      result += val;
    }

    prevCmd = cmd;
  }

  return result;
};


// Translate path to (x [, y])
//
SvgPath.prototype.translate = function (x, y) {
  this.__stack.push(matrix().translate(x, y || 0));
  return this;
};


// Scale path to (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.scale = function (sx, sy) {
  this.__stack.push(matrix().scale(sx, (!sy && (sy !== 0)) ? sx : sy));
  return this;
};


// Rotate path around point (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.rotate = function (angle, rx, ry) {
  this.__stack.push(matrix().rotate(angle, rx || 0, ry || 0));
  return this;
};


// Skew path along the X axis by `degrees` angle
//
SvgPath.prototype.skewX = function (degrees) {
  this.__stack.push(matrix().skewX(degrees));
  return this;
};


// Skew path along the Y axis by `degrees` angle
//
SvgPath.prototype.skewY = function (degrees) {
  this.__stack.push(matrix().skewY(degrees));
  return this;
};


// Apply matrix transform (array of 6 elements)
//
SvgPath.prototype.matrix = function (m) {
  this.__stack.push(matrix().matrix(m));
  return this;
};


// Transform path according to "transform" attr of SVG spec
//
SvgPath.prototype.transform = function (transformString) {
  if (!transformString.trim()) {
    return this;
  }
  this.__stack.push(transformParse(transformString));
  return this;
};


// Round coords with given decimal precition.
// 0 by default (to integers)
//
SvgPath.prototype.round = function (d) {
  var contourStartDeltaX = 0, contourStartDeltaY = 0, deltaX = 0, deltaY = 0, l;

  d = d || 0;

  this.__evaluateStack();

  this.segments.forEach(function (s) {
    var isRelative = (s.type.toLowerCase() === s.type);
    var values = s.values;
    switch (s.type) {
      case 'H':
      case 'h':
        if (isRelative) { values[0] += deltaX; }
        deltaX = values[0] - values[0].toFixed(d);
        values[0] = +values[0].toFixed(d);
        return;

      case 'V':
      case 'v':
        if (isRelative) { values[0] += deltaY; }
        deltaY = values[0] - values[0].toFixed(d);
        values[0] = +values[0].toFixed(d);
        return;

      case 'Z':
      case 'z':
        deltaX = contourStartDeltaX;
        deltaY = contourStartDeltaY;
        return;

      case 'M':
      case 'm':
        if (isRelative) {
          values[0] += deltaX;
          values[1] += deltaY;
        }

        deltaX = values[0] - values[0].toFixed(d);
        deltaY = values[1] - values[1].toFixed(d);

        contourStartDeltaX = deltaX;
        contourStartDeltaY = deltaY;

        values[0] = +values[0].toFixed(d);
        values[1] = +values[1].toFixed(d);
        return;

      case 'A':
      case 'a':
        // [cmd, rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        if (isRelative) {
          values[5] += deltaX;
          values[6] += deltaY;
        }

        deltaX = values[5] - values[5].toFixed(d);
        deltaY = values[6] - values[6].toFixed(d);

        values[0] = +values[0].toFixed(d);
        values[1] = +values[1].toFixed(d);
        values[2] = +values[2].toFixed(d + 2); // better precision for rotation
        values[5] = +values[5].toFixed(d);
        values[6] = +values[6].toFixed(d);
        return;

      default:
        // a c l q s t
        l = values.length;

        if (isRelative) {
          values[l - 2] += deltaX;
          values[l - 1] += deltaY;
        }

        deltaX = values[l - 2] - values[l - 2].toFixed(d);
        deltaY = values[l - 1] - values[l - 1].toFixed(d);

        values.forEach(function (val, i) {
          values[i] = +values[i].toFixed(d);
        });
        return;
    }
  });

  return this;
};


// Apply iterator function to all segments. If function returns result,
// current segment will be replaced to array of returned segments.
// If empty array is returned, current regment will be deleted.
//
SvgPath.prototype.iterate = function (iterator, keepLazyStack) {
  var segments = this.segments,
      replacements = {},
      needReplace = false,
      lastX = 0,
      lastY = 0,
      countourStartX = 0,
      countourStartY = 0;
  var i, j, newSegments;

  if (!keepLazyStack) {
    this.__evaluateStack();
  }

  segments.forEach(function (s, index) {

    var res = iterator(s, index, lastX, lastY);

    if (Array.isArray(res)) {
      replacements[index] = res;
      needReplace = true;
    }

    var isRelative = (s.type === s.type.toLowerCase());
    var values = s.values;

    // calculate absolute X and Y
    switch (s.type) {
      case 'm':
      case 'M':
        lastX = values[0] + (isRelative ? lastX : 0);
        lastY = values[1] + (isRelative ? lastY : 0);
        countourStartX = lastX;
        countourStartY = lastY;
        return;

      case 'h':
      case 'H':
        lastX = values[0] + (isRelative ? lastX : 0);
        return;

      case 'v':
      case 'V':
        lastY = values[0] + (isRelative ? lastY : 0);
        return;

      case 'z':
      case 'Z':
        // That make sence for multiple contours
        lastX = countourStartX;
        lastY = countourStartY;
        return;

      default:
        lastX = values[values.length - 2] + (isRelative ? lastX : 0);
        lastY = values[values.length - 1] + (isRelative ? lastY : 0);
    }
  });

  // Replace segments if iterator return results

  if (!needReplace) { return this; }

  newSegments = [];

  for (i = 0; i < segments.length; i++) {
    if (typeof replacements[i] !== 'undefined') {
      for (j = 0; j < replacements[i].length; j++) {
        newSegments.push(replacements[i][j]);
      }
    } else {
      newSegments.push(segments[i]);
    }
  }

  this.segments = newSegments;

  return this;
};


// Converts segments from relative to absolute
//
SvgPath.prototype.abs = function () {

  this.iterate(function (s, index, x, y) {
    var name = s.type,
        nameUC = name.toUpperCase(),
        i;
    var values = s.values;

    // Skip absolute commands
    if (name === nameUC) { return; }

    s.type = nameUC;

    switch (name) {
      case 'v':
        // v has shifted coords parity
        values[0] += y;
        return;

      case 'a':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch x, y only
        values[5] += x;
        values[6] += y;
        return;

      default:
        for (i = 0; i < values.length; i++) {
          values[i] += i % 2 ? y : x; // odd values are Y, even - X (ex: [x, y])
        }
    }
  }, true);

  return this;
};


// Converts segments from absolute to relative
//
SvgPath.prototype.rel = function () {

  this.iterate(function (s, index, x, y) {
    var name = s.type,
        nameLC = name.toLowerCase(),
        i;
    var values = s.values;

    // Skip relative commands
    if (name === nameLC) { return; }

    // Don't touch the first M to avoid potential confusions.
    if (index === 0 && name === 'M') { return; }

    s.type = nameLC;

    switch (name) {
      case 'V':
        // V has shifted coords parity
        values[0] -= y;
        return;

      case 'A':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch x, y only
        values[5] -= x;
        values[6] -= y;
        return;

      default:
        for (i = 0; i < values.length; i++) {
          values[i] -= i % 2 ? y : x; // odd values are Y, even - X (ex: [x, y])
        }
    }
  }, true);

  return this;
};


// Converts arcs to cubic bézier curves
//
SvgPath.prototype.unarc = function () {
  this.iterate(function (s, index, x, y) {
    var new_segments, nextX, nextY, result = [], name = s.type;
    var values = s.values;

    // Skip anything except arcs
    if (name !== 'A' && name !== 'a') { return null; }

    if (name === 'a') {
      // convert relative arc coordinates to absolute
      nextX = x + values[5];
      nextY = y + values[6];
    } else {
      nextX = values[5];
      nextY = values[6];
    }

    new_segments = a2c(x, y, nextX, nextY, values[3], values[4], values[0], values[1], values[2]);

    // Degenerated arcs can be ignored by renderer, but should not be dropped
    // to avoid collisions with `S A S` and so on. Replace with empty line.
    if (new_segments.length === 0) {
      return [ { type: name === 'a' ? 'l' : 'L', values: [ values[5], values[6] ] } ];
    }

    new_segments.forEach(function (s) {
      result.push({ type: 'C', values: [ s[2], s[3], s[4], s[5], s[6], s[7] ] });
    });

    return result;
  });

  return this;
};


// Converts smooth curves (with missed control point) to generic curves
//
SvgPath.prototype.unshort = function () {
  var segments = this.segments;
  var prevControlX, prevControlY, prevSegment;
  var curControlX, curControlY;

  // TODO: add lazy evaluation flag when relative commands supported

  this.iterate(function (s, idx, x, y) {
    var name = s.type, nameUC = name.toUpperCase(), isRelative;
    var values = s.values;
    // First command MUST be M|m, it's safe to skip.
    // Protect from access to [-1] for sure.
    if (!idx) { return; }

    if (nameUC === 'T') { // quadratic curve
      isRelative = (name === 't');

      prevSegment = segments[idx - 1];

      if (prevSegment.type === 'Q') {
        prevControlX = prevSegment.values[0] - x;
        prevControlY = prevSegment.values[1] - y;
      } else if (prevSegment.type === 'q') {
        prevControlX = prevSegment.values[0] - prevSegment.values[2];
        prevControlY = prevSegment.values[1] - prevSegment.values[3];
      } else {
        prevControlX = 0;
        prevControlY = 0;
      }

      curControlX = -prevControlX;
      curControlY = -prevControlY;

      if (!isRelative) {
        curControlX += x;
        curControlY += y;
      }

      segments[idx] = {
        type: isRelative ? 'q' : 'Q', 
        values: [
          curControlX, curControlY,
          values[0], values[1]
        ]
      };

    } else if (nameUC === 'S') { // cubic curve
      isRelative = (name === 's');

      prevSegment = segments[idx - 1];

      if (prevSegment.type === 'C') {
        prevControlX = prevSegment.values[2] - x;
        prevControlY = prevSegment.values[3] - y;
      } else if (prevSegment.type === 'c') {
        prevControlX = prevSegment.values[2] - prevSegment.values[4];
        prevControlY = prevSegment.values[3] - prevSegment.values[5];
      } else {
        prevControlX = 0;
        prevControlY = 0;
      }

      curControlX = -prevControlX;
      curControlY = -prevControlY;

      if (!isRelative) {
        curControlX += x;
        curControlY += y;
      }

      segments[idx] = {
        type: isRelative ? 'c' : 'C',
        values: [
          curControlX, curControlY,
          values[0], values[1], values[2], values[3]
        ]
      };
    }
  });

  return this;
};


module.exports = SvgPath;
