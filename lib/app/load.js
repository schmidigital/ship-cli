var async = require('async'),
	_ = require('lodash'),
	util = require('util'),
	__Configuration = require('./configuration'),
	__initializeHooks = require('./private/loadHooks');



module.exports = function(ship) {
	var Configuration = __Configuration(ship);
  	var initializeHooks = __initializeHooks(ship);


	return function load(configOverride, cb) {
		
		
		// configOverride is optional
		if (_.isFunction(configOverride)) {
		cb = configOverride;
		configOverride = {};
		}

		// Ensure override is an object and clone it (or make an empty object if it's not)
		configOverride = configOverride || {};
		ship.config = _.cloneDeep(configOverride);

		
		async.auto({

			// Apply core defaults and hook-agnostic configuration,
			// esp. overrides including command-line options, environment variables,
			// and options that were passed in programmatically.
			config: Configuration.load,
			
			     // Load hooks into memory, with their middleware and routes
			hooks: ['config', loadHooks],
			test: function(cb) {
				cb()
			},	
			
		}, ready__(cb));
		
		return ship;
	}
	
		

	/**
	 * Load hooks in parallel
	 * let them work out dependencies themselves,
	 * taking advantage of events fired from the sails object
	 *
	 * @api private
	 */
	function loadHooks(results, cb) {
		ship.hooks = { };

		// If config.hooks is disabled, skip hook loading altogether
		if (ship.config.hooks === false) {
			return cb();
		}

		async.series([

		function(cb) {
			loadHookDefinitions(ship.hooks, cb);
		},
		function(cb) {
			initializeHooks(ship.hooks, cb);
		}
		], function(err) {
		if (err) return cb(err);

		// Inform any listeners that the initial, built-in hooks
		// are finished loading
		//sails.emit('hooks:builtIn:ready');
		//sails.log.verbose('Built-in hooks are ready.');
		return cb();
		});
	}

	/**
	 * Load built-in hook definitions from `sails.config.hooks`
	 * and put them back into `hooks` (probably `sails.hooks`)
	 *
	 * @api private
	 */
	function loadHookDefinitions(hooks, cb) {

		// Mix in user-configured hook definitions
		_.extend(hooks, ship.config.hooks);
		
		// Make sure these changes to the hooks object get applied
		// to sails.config.hooks to keep logic consistent
		// (I think we can get away w/o this, but leaving as a stub)
		// sails.config.hooks = hooks;

		// If user configured `loadHooks`, only include those.
		if (ship.config.loadHooks) {
		if (!_.isArray(sails.config.loadHooks)) {
			return cb('Invalid `loadHooks` config.  ' +
			'Please specify an array of string hook names.\n' +
			'You specified ::' + util.inspect(ship.config.loadHooks));
		}

		_.each(hooks, function(def, hookName) {
			if (!_.contains(ship.config.loadHooks, hookName)) {
			hooks[hookName] = false;
			}
		});
		sails.log.verbose('Deliberate partial load-- will only initialize hooks ::', sails.config.loadHooks);
		}

		return cb();
	}

	
	 /**
	 * Returns function which is fired when Sails is ready to go
	 *
	 * @api private
	 */
	function ready__(cb) {
		return function(err) {
		if (err) {
			return cb && cb(err);
		}


		console.log("All hooks loaded successfully...")

		// If userconfig hook is turned off, still load globals.
		/*if (sails.config.hooks && sails.config.hooks.userconfig === false ||
			(sails.config.loadHooks && sails.config.loadHooks.indexOf('userconfig') == -1)) {
				sails.exposeGlobals();
		}*/

		cb && cb(null, ship);
		};
	}
}