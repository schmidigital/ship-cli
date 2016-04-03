var Ship = require('./Ship');
var _ = require('lodash');


/**
 * Expose `Sails` factory
 * (maintains backwards compatibility w/ constructor usage)
 */

module.exports = ShipFactory;

function ShipFactory() {
  return new Ship();
}