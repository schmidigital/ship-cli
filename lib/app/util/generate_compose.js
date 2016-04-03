var fs = require('fs'),
    YAML = require('yamljs'),
    _ = require('lodash')

module.exports = function () {
  	var env = process.env.SHIP_ENV;

    // 1. Load Settings
    var settings = YAML.load( scope.rootPath + '/config/settings.yml');

    // 2. Load Template
    var template = YAML.load( scope.rootPath + '/config/templates/' + config.profile + '/' + config.profile + '.yml');

    // 3. Load Environment
    var env = YAML.load( scope.rootPath + '/config/env/' + env + '.yml');


    var compose = _.merge(template, settings, env)

    compose.web.environment.VIRTUAL_HOST = "*." + env.web.environment.URL + "," + env.web.environment.URL;
    compose.web.environment.LETSENCRYPT_HOST = "www." + env.web.environment.URL + "," + env.web.environment.URL;
    compose.web.environment.LETSENCRYPT_EMAIL = "info@" + env.web.environment.URL;

    // Taking package.json to find out which user/group the project belongs to
    var stats = fs.statSync( scope.rootPath + "/package.json")

    compose.web.environment.HOST_UID = stats.uid;
    compose.web.environment.HOST_GID = stats.gid;

    compose.web.environment.VIRTUAL_HOST = "*." + env.web.environment.URL + ", " + env.web.environment.URL;;

    // Generate YAML 
    docker_compose = YAML.stringify(compose, 4);

    var result = fs.writeFileSync(scope.rootPath + "/docker-compose.yml", docker_compose); 

    return compose;
}	