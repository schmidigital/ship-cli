/**
 * Module dependencies.
 */

var _ = require('lodash');
var async = require('async');
var path = require('path');


module.exports = function(ship) {
  
  /**
   * Expose Configuration loader
   *
   * Load command-line overrides
   *
   * TODO: consider merging this into the `app` directory
   *
   * For reference, config priority is:
   * --> implicit defaults
   * --> environment variables
   * --> user config files
   * --> local config file
   * --> configOverride ( in call to ship.lift() )
   * --> --cmdline args
   */
  

  return function loadConfig(cb) {
    

    // Save reference to context for use in closures
    var self = this;

    // Commence with loading/validating/defaulting all the rest of the config
    async.auto({

        /**
         * Until this point this point, `ship.config` is composed only of
         * configuration overrides passed into `ship.lift(overrides)`
         * (or `ship.load(overrides)`-- same thing)
         *
         * This step clones this into an "overrides" object, negotiating cmdline
         * shortcuts into the properly namespced ship configuration options.
         */
        mapOverrides: function(cb) {

          // Clone the `overrides` that were passed in.
          var overrides = _.cloneDeep(ship.config || {});
          
          
          // TODO: bring the rconf stuff from bin/ship-lift in here

          // Command-line arguments take highest precedence
          // overrides = _.merge(overrides, argv);

          // Map ship options from overrides
          overrides = _.merge(overrides, {

            // `--verbose` command-line argument
            // `--silly` command-line argument
            // `--silent` command-line argument
            log: overrides.verbose ? {
              level: 'verbose'
            } : overrides.silly ? {
              level: 'silly'
            } : overrides.silent ? {
              level: 'silent'
            } : undefined,

            // `--port=?` command-line argument
            port: overrides.port || undefined,

            // `--prod` command-line argument
            environment: overrides.prod ? 'production' : (overrides.dev ? 'development' : undefined)

          });
          

          // Pass on overrides object
          cb(null, overrides);
        },


        /**
         * Ensure that environment variables are applied to important configs
         */
        mixinDefaults: ['mapOverrides',
          function(results, cb) {
            
            // Get overrides
            var overrides = results.mapOverrides; //_.cloneDeep(results.mapOverrides);

            // Apply environment variables
            // (if the config values are not set in overrides)
            overrides.environment = overrides.environment || process.env.NODE_ENV;


            // Generate implicit, built-in framework defaults for the app
            var implicitDefaults = self.defaults(overrides.appPath || process.cwd());

            // Extend copy of implicit defaults with user config
            var mergedConfig = _.merge(_.cloneDeep(implicitDefaults), overrides);

            // Override the environment variable so express and other modules
            // which expect NODE_ENV to be set mirror the configured ship environment.
            //ship.log.verbose('Setting Node environment...');

            // Setting an environment var explicitly to "undefined" sets it to the
            // *string* "undefined".  So we have to check if there's something to set first.
            if (mergedConfig.environment) {
              process.env['NODE_ENV'] = mergedConfig.environment;
            }

            cb(null, mergedConfig);
          }
        ]

      },


      function configLoaded(err, results) {
        if (err) {
          ship.log.error('Error encountered loading config ::\n', err);
          return cb(err);
        }
        
        // Override the previous contents of ship.config with the new, validated
        // config w/ defaults and overrides mixed in the appropriate order.
        ship.config = results.mixinDefaults;
        
        
        cb();
      });
  };

};