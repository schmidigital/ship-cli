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

    //ship.initialize

  ], function sailsReady(err) { //TODO: unused variable async_data
    console.log("sails is ready")

    console.log(ship.config)

    /*if (err) {
      return sails.lower(function(errorLoweringSails) {
        if (errorLoweringSails) {
          sails.log.error('When trying to lower the app as a result of a failed lift, encountered an error:', errorLoweringSails);
        }
        cb(err);
      });
    }*/


    // SETUP EVERYTHING AFTER SHIP IS LIFTED
    //var settings = generate_compose();

    //check_reverse_proxy();
    //generate_nginx();
    //clone_branches(config.branches, settings)

    //shell(dockercompose + " up -d")

    //setup_branches(config.branches, settings)

    // try {console.timeEnd('core_lift');}catch(e){}


    //sails.emit('lifted');
    //sails.isLifted = true;
    //return cb(null, sails);
  });
};


// Is this the responsibility of ship?

/*function check_reverse_proxy () {
  var env = process.env.SHIP_ENV;


  var running = syncExec('docker inspect --format="{{ .State.Running }}" jwilderproxy 2> /dev/null');
  var port = (env == "local" ? 80 : 13337)

  if (running.stdout.indexOf("false") !=-1) {
    console.log("Reverse Proxy not started. Starting...".yellow)
    syncExec("docker start jwilderproxy")
  }

  else if (running.stdout.indexOf("true") !=-1) {
    console.log("Reverse Proxy already running. Nice!".green)
  }

  else {
    console.log("Reverse Proxy not running. Starting...".red)
    syncExec("docker run --name jwilderproxy -d -p " + port + ":80 -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy")
  }
}*/