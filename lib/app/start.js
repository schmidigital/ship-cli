/**
 * Module dependencies.
 */

var async = require('async');
var _ = require('lodash');


/**
 * Ship.prototype.start()
 *
 * Loads the app, then starts all attached servers.
 *
 * @api public
 */

module.exports = function start(configOverride, cb) {
  var ship = this;
  

  // configOverride is optional
  if (_.isFunction(configOverride)) {
    cb = configOverride;
    configOverride = {};
  }

  // Callback is optional
  cb = cb || function(err) {
    if (err) return ship.log.error(err);
  };

  async.series([

    function(callback) {
      ship.load(configOverride, callback);
    }

  ], function sailsReady(err) { //TODO: unused variable async_data
    console.log("Ship is ready to go!")
    
    console.log("Starting your " + ship.config.profile + " App");

    ship.hooks[ship.config.profile].start();
  });
};
