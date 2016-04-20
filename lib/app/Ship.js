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
  
  this.down = require('./down');

  this.start = _.bind(this.start, this);
  this.load = _.bind(this.load, this);
  this.down = _.bind(this.load, this);
}


Ship.prototype.start = require('./start');
Ship.prototype.util = require('./util')

// Expose Sails constructor
module.exports = Ship;