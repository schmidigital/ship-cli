var _ = require('lodash');

module.exports = function(ship) {

	/**
	 * `userhooks`
	 *
	 * Ship hook for loading user plugins (hooks)
	 */
	return {

		defaults: { },

		initialize: function(cb) {

			if ( !ship.config.hooks.moduleloader ) {
				return cb('Cannot load user hooks without `moduleloader` hook enabled!');
			}

			// Wait for moduleloader
			//ship.log.verbose('Loading user hooks...');

			// Load user hook definitions
			ship.modules.loadUserHooks(function hookDefinitionsLoaded(err, hooks) {
				if (err) return cb(err);

        // Ensure hooks is valid
        hooks = _.isObject(hooks) ? hooks : {};

        // Add the user hooks to the list of hooks to load
        _.extend(ship.hooks, hooks);

				return cb();

			});
		}
	};
};