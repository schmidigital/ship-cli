module.exports = function(ship) {


	/**
	 * Module dependencies
	 */

  var _ = require('lodash');


	/**
	 * Userconfig
	 *
	 * Load configuration files.
	 */
	return {


		// Default configuration
		defaults: {},


		/**
		 * Fetch relevant modules, exposing them on `ship` subglobal if necessary,
		 */
		loadModules: function (cb) {

			//ship.log.verbose('Loading app config...');

			// Grab reference to mapped overrides
			var overrides = _.cloneDeep(ship.config);


			// If appPath not specified yet, use process.cwd()
			// (the directory where this ship process is being initiated from)
			if ( ! overrides.appPath ) {
				ship.config.appPath = process.cwd();
			}

			// Load config dictionary from app modules
			ship.modules.loadUserConfig(function loadedAppConfigModules (err, userConfig) {
				if (err) return cb(err);

				// Finally, extend user config with overrides
				var config = {};

				config = _.merge(userConfig, overrides);

				// Ensure final configuration object is valid
				// (in case moduleloader fails miserably)
				config = _.isObject(config) ? config : (ship.config || {});

				// Save final config into ship.config
				ship.config = config;

				// Other hooks may use process.env.NODE_ENV to determine the environment,
				// so set that here.  The userconfig hook will set the environment based
				// on the overrides (command line or environment var), local.js key
				// (if available) or else a default of "development"
				process.env.NODE_ENV = ship.config.environment;

				cb();
			});
		}
	};
};
