var _ = require('lodash'),
	loadShip = require('./load'),
	package = require('../../package.json')

/**
 * Construct a Ship (app) instance.
 *
 * @constructor
 */

function Ship() {
  this.load = loadShip(this);

  this.start = _.bind(this.start, this);
  this.load = _.bind(this.load, this);
  this.down = _.bind(this.down, this);
}


Ship.prototype.start = require('./start');
Ship.prototype.down = require('./down');
Ship.prototype.util = require('./util')

// Expose Sails constructor
module.exports = Ship;