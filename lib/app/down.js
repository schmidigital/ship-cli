var util = require("./util");

module.exports = function(ship) {
    util.shell("docker-compose down -v")
}