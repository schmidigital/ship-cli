Ship = require('../lib/app');

module.exports = function () {

	var globalShip = Ship();
	globalShip.down(afterwards);


	function afterwards (err, ship) {
		if (err) {
		var message = err.stack ? err.stack : err;
		ship ? console.log(message) : console.log(message); process.exit(1);
		}
		// try {console.timeEnd('cli_lift');}catch(e){}
	}

}