/**
 * Module dependencies
 */

var async = require('async'),
    utils = require('ship-utils'),
    fs = require('fs-extra'),
    path = require('path'),
    YAML = require('yamljs'),
    syncExec = require('sync-exec'),
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
        odoo: {
          version: 9
        }
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

      syncExec('chmod +x ' + ship.config.appPath + '/data/tools/*').stdout.replace(/(\r\n|\n|\r)/gm,"")

      var template = YAML.load( path.resolve(__dirname, './template.yml'));
      var stats = fs.statSync(ship.config.appPath + '/package.json');
      var environment_file = require(path.resolve(ship.config.appPath, './config/environment/', ship.config.environment) + '.js');
      
      template.odoo.image = "odoo:" + ship.config.odoo.version;
      
      var environment_odoo = {
            DOCKER_USER: "odoo",
            DOCKER_GROUP: "odoo",
            HOST_USER_ID: stats.uid,
            HOST_GROUP_ID: stats.gid,
            VIRTUAL_HOST: environment_file.url,
      }
        
      _.merge(template.odoo.environment, environment_odoo)
     
     
      var environment_db = {
            DOCKER_USER: "postgres", 
            DOCKER_GROUP: "postgres",
            HOST_USER_ID: stats.uid,
            HOST_GROUP_ID: stats.gid,
      }
        
      _.merge(template.db.environment, environment_db) 

      var docker_compose_file = YAML.stringify(template, 4);
      var docker_compose_dest = path.resolve(ship.config.appPath) + '/docker-compose.yml';

      
      fs.writeFileSync(docker_compose_dest, docker_compose_file); 

      
      utils.shell("docker-compose up -d")
    }



  };
};
