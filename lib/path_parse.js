'use strict';

function isCommand(code) {
  /*eslint-disable no-bitwise*/
  switch (code | 0x20) {
    case 0x6D/* m */:
    case 0x7A/* z */:
    case 0x6C/* l */:
    case 0x68/* h */:
    case 0x76/* v */:
    case 0x63/* c */:
    case 0x73/* s */:
    case 0x71/* q */:
    case 0x74/* t */:
    case 0x61/* a */:
    case 0x72/* r */:
      return true;
  }
  return false;
}

const PATH_REGEX = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

function fastParse(path) {
  const tokens = path.match(PATH_REGEX);
  const segments = [];

  let err = '';
  let lastCommand;

  if (!tokens) {
    return {
      err,
      segments
    }
  }

  loop: for (let i = 0; i < tokens.length; ) {
    let token = tokens[i++];
    if (!token) continue;

    if (!segments.length && token !== 'm' && token !== 'M') {
      err = isCommand(token.toLowerCase().charCodeAt(0)) ? 'SvgPath: string should start with `M` or `m`' : `SvgPath: bad command ${token} (at pos 0)`;
      break;
    }

    // Check if it's not a command - last command should be used
    let charCode = token.charCodeAt(0);
    if (charCode < 65) {
      i -= 1;
      token = lastCommand
      if (token === 'M') {
        token = 'L';
      } else if (token === 'm') {
        token = 'l';
      }
      charCode = token.charCodeAt(0);
    }

    lastCommand = token;
    switch (charCode) {
      case 77:  // M
      case 109: // m
      case 76:  // L
      case 108: // l
      case 84:  // T
      case 116: // t 
      {
        let x = +tokens[i++];
        let y = +tokens[i++];

        if (isNaN(x) || isNaN(y)) {
          err = `SvgPath: missed param after ${token}`;
          break loop;
        }

        // first m should be processed as absolute
        if (charCode === 109 && !segments.length) {
          token = 'M';
          charCode = 77;
        }

        segments.push([charCode, x, y]);
        break
      }

      case 67: // C
      case 99: // c
      {
        let x1 = +tokens[i++];
        let y1 = +tokens[i++];
        let x2 = +tokens[i++];
        let y2 = +tokens[i++];
        let x = +tokens[i++];
        let y = +tokens[i++];

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || isNaN(x) || isNaN(y)) {
          err = `SvgPath: missed param after ${token}`;
          break loop;
        }

        segments.push([charCode, x1, y1, x2, y2, x, y]);
        break
      }

      case 83: // S
      case 115: // s
      case 81: // Q
      case 113: // q 
      {
        let x1 = +tokens[i++];
        let y1 = +tokens[i++];
        let x = +tokens[i++];
        let y = +tokens[i++];

        if (isNaN(x1) || isNaN(y1) || isNaN(x) || isNaN(y)) {
          err = `SvgPath: missed param after ${token}`;
          break loop;
        }

        segments.push([charCode, x1, y1, x, y]);
        break;
      }

      case 72: // H
      case 104: // h 
      {
        let x = +tokens[i++];

        if (isNaN(x)) {
          err = `SvgPath: missed param after ${token}`;
          break loop;
        }

        segments.push([charCode, x]);
        break;
      }
      case 86: // V
      case 118: // v 
      {
        let y = +tokens[i++];

        if (isNaN(y)) {
          err = `SvgPath: missed param after ${token}`;
          break loop;
        }

        segments.push([charCode, y]);
        break;
      }

      case 65: // A
      case 97: // a 
      {
        const rx = +tokens[i++];
        const ry = +tokens[i++];
        const xRotation = +tokens[i++];
        let next = tokens[i++];
        let largeArcFlag, sweepFlag, x;
        if (next && next.length > 1 && next[0] === '0') {
          largeArcFlag = 0;
          sweepFlag = +next[1];
          if (next.length > 2) {
            x = +next.slice(2);
          } else {
            x = +tokens[i++];
          }
        } else {
          largeArcFlag = +next;
          sweepFlag = +tokens[i++];
          x = +tokens[i++];
        }
        let y = +tokens[i++];

        if (sweepFlag !== 0 && sweepFlag !== 1 || largeArcFlag !== 0 && largeArcFlag !== 1) {
          err = `SvgPath: arc flag can be 0 or 1 only`;
          break loop;
        }

        if (isNaN(rx) || isNaN(ry) || isNaN(xRotation) || isNaN(x) || isNaN(y)) {
          err = `SvgPath: missed param after ${token}`;
          break loop;
        }

        segments.push([charCode, rx, ry, xRotation, largeArcFlag, sweepFlag, x, y]);
        break;
      }

      case 90: // Z
      case 122: // z 
      {
        segments.push([charCode]);
        break;
      }

      default: {
        err = `SvgPath: bad command ${token}`;
        if (token !== '.' && token !== 'e' && token !== 'E' && token !== '-' && token !== '+') {
          err += ` (at pos ${path.indexOf(token)})`;
        }
        break loop;
      }
    }
  }

  return {
    err,
    segments
  }
}

/* Returns array of segments:
 *
 * [
 *   [ command, coord1, coord2, ... ]
 * ]
 */
module.exports = fastParse
