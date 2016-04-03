var nodepath = require('path'),
	package = require('../package.json')
	Ship = require('../lib/app');

module.exports = function () {
 
	// Build initial scope
	var scope = {
		rootPath: process.cwd(),
		shipRoot: nodepath.resolve(__dirname, '..'),
		shipPackageJSON: package
	};


	// Pass the original CLI arguments down to the generator
	// (but first, remove commander's extra argument)
	var cliArguments = Array.prototype.slice.call(arguments);
	scope.args = cliArguments;


	var globalShip = Ship();
	globalShip.start(scope);

}