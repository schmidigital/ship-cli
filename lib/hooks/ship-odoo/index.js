/**
 * Module dependencies
 */

var async = require('async'),
    utils = require('ship-utils'),
    fs = require('fs-extra'),
    path = require('path'),
    YAML = require('yamljs'),
    _ = require('lodash');



/**
 * Profile Loader hook
 * 
 * Loads the settings and default commands for any given profile.
 * e.g. wordpress, odoo, magento, etc.
 *
 * @param  {ShipApp} ship
 * @return {Dictionary} [hook definition]
 */
module.exports = function (ship) {

  /**
   * Build the hook definition.
   * (this is returned below)
   *
   * @type {Dictionary}
   */
  return {


    /**
     * defaults
     *
     * The implicit configuration defaults merged into `sails.config` by this hook.
     *
     * @type {Dictionary}
     */
    defaults: {
    },



    /**
     * configure()
     *
     * @type {Function}
     */
    configure: function() {

    },



    /**
     * initialize()
     *
     * Logic to run when this hook loads.
     */
    initialize: function (next) {
      return next();
    },
    
    start: function (params) {
      
      fs.copySync(path.resolve(__dirname,'./docker-tools'), path.resolve(ship.config.appPath, './data/tools'));
      fs.chmodSync(path.resolve(ship.config.appPath, './data/tools/permission_fix'), "755")

      var template = YAML.load( path.resolve(__dirname, './template.yml'));
      var stats = fs.statSync(ship.config.appPath + '/package.json');
      var environment_file = require(path.resolve(ship.config.appPath, './config/environment/', ship.config.environment) + '.js');
      
      var environment = {
            DOCKER_USER: "odoo",
            DOCKER_GROUP: "odoo",
            HOST_USER_ID: stats.uid,
            HOST_GROUP_ID: stats.gid,
            VIRTUAL_HOST: environment_file.url,
            COMMAND: "su -s /bin/bash -c 'openerp-server' odoo"
      }
        
      _.merge(template.odoo.environment, environment)
      

      var docker_compose_file = YAML.stringify(template, 4);
      var docker_compose_dest = path.resolve(ship.config.appPath) + '/docker-compose.yml';

      
      fs.writeFileSync(docker_compose_dest, docker_compose_file); 

      
      utils.shell("docker-compose up -d")
    }



  };
};