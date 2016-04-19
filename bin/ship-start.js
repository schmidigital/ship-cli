var nodepath = require('path'),
	package = require('../package.json'),
	rconf = require('../lib/app/configuration/rc'),
	Ship = require('../lib/app');

module.exports = function () {
 
	
	// Build initial scope, mixing-in rc config
	var scope = _.merge({
		rootPath: process.cwd(),
		//shipRoot: nodepath.resolve(__dirname, '..'),
		shipPackageJSON: package
	}, rconf);
	

	// Pass the original CLI arguments down to the generator
	// (but first, remove commander's extra argument)
	var cliArguments = Array.prototype.slice.call(arguments);
	scope.args = cliArguments;


	var globalShip = Ship();
	globalShip.start(scope, afterwards);


	function afterwards (err, ship) {
		if (err) {
		var message = err.stack ? err.stack : err;
		ship ? console.log(message) : console.log(message); process.exit(1);
		}
		// try {console.timeEnd('cli_lift');}catch(e){}
	}

}