var _ = require('lodash'),
	package = require('../../package.json')


// Should be replaced...
var scope = {
	rootPath: process.cwd(),
	shipRoot: nodepath.resolve(__dirname, '..'),
	shipPackageJSON: package
};

/**
 * Construct a Ship (app) instance.
 *
 * @constructor
 */

function Ship() {
  this.start = _.bind(this.start, this);

  // TODO: Create Config Loader
  this.config = {
	rootPath: process.cwd(),
	shipRoot: nodepath.resolve(__dirname, '..'),
	shipPackageJSON: package,
  	local: scope.rootPath + "/config/local.json"
  }
}


Ship.prototype.start = require('./start');
 

Sails.prototype.util = require('./util')

// Expose Sails constructor
module.exports = Ship;