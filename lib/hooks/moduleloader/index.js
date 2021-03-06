module.exports = function(ship) {

  /**
   * Module dependencies
   */
  var path = require('path');
  var async = require('async');
  var _ = require('lodash');
  var walk = require('walk');
  var buildDictionary = require('sails-build-dictionary');




  /**
   * Module loader
   *
   * Load code files from a ship app into memory; modules like controllers,
   * models, services, config, etc.
   */
  return {


    defaults: function (config) {

      var localConfig = {

        // The path to the application
        appPath: config.appPath ? path.resolve(config.appPath) : process.cwd(),

        // Paths for application modules and key files
        // If `paths.app` not specified, use process.cwd()
        // (the directory where this ship process is being initiated from)
        paths: {

          // Configuration
          //
          // For `userconfig` hook
          config: path.resolve(config.appPath, 'config'),

          hooks: path.resolve(config.appPath, 'api/hooks'),
          
        },


        moduleloader: {
          // configExt and sourceExt will be changed in ship v1
          // (probably unified into a single config)
          configExt: undefined,
          sourceExt: undefined
        },

        // `ship.config.moduleLoaderOverride` will be deprecated in ship v1.
        moduleLoaderOverride: undefined

      };

      var conf = localConfig.moduleloader;

      // Declare supported languages.
      // To add another language use the format below.
      // {
      //   extensions: An array of file extensions supported by this module
      //   module: the NPM module name
      //   require: the require statement
      // }
      var supportedLangs = [
        {
          extensions: ['iced','liticed'],
          module: 'iced-coffee-script',
          require: 'iced-coffee-script/register'
        },
        {
          extensions: ['coffee','litcoffee'],
          module: 'coffee-script',
          require: 'coffee-script/register'
        },
        {
          extensions: ['ls'],
          module: 'LiveScript',
          require: 'livescript'
        }
      ];

      var detectedLangs = [];
      var detectedExtens = [];

      // Options for `walk`
      var walkOpts = {
        listeners: {
          // This function runs once for every found file when
          // we walk the directory tree
          file: function (root, fileStats, next) {
            var fileName = fileStats.name;
            var extens = path.extname(fileName).substring(1);

            // Look for every file extension we support and flag the appropriate language
            _.forEach(supportedLangs, function(lang){
              // If we have already found a language, skip it.
              if (!_.contains(detectedLangs, lang.module)) {
                // If we find a new one, add it to the list.
                if (_.contains(lang.extensions, extens)) {
                  detectedLangs.push(lang.module);
                }
              }
            });

            next();
          },
          errors: function (root, nodeStatsArray, next) {
            next();
          },
        },

        // Do not detect languages from node_modules/ directories
        // which might be embedded within app.
        filters: ['node_modules'],
      };

      // Walk the /api and /config directories
      walk.walkSync(localConfig.appPath+'/api', walkOpts);
      walk.walkSync(localConfig.appPath+'/config', walkOpts);

      // ----------------------------------------------------------------------
      // This slows down lift time **a lot** (~500ms on medium-sized app
      // when lifting on MacOS X with an SSD).  This should be pulled out
      // of core and provided as a hook. The hook API might need to be
      // extended to allow this to be done gracefully.
      // ----------------------------------------------------------------------

      //ship.log.verbose('In this ship app, detected special code languages:',detectedLangs.length, detectedLangs);
      //ship.log.silly('(and detected %d special file extensions:',detectedExtens.length, detectedExtens,')');

      // Check for which languages were found and load the necessary modules to compile them
      _.forEach(detectedLangs, function(moduleName){
        var lang = _.find(supportedLangs, {module: moduleName});
        detectedExtens = detectedExtens.concat(lang.extensions);

        try {
           require(lang.require);
        } catch(e0){
          try {
            require(path.join(localConfig.appPath, 'node_modules/'+lang.require));
          }
          catch (e1) {
            ship.log.error('Please run `npm install '+lang.module+'` to use '+lang.module+'!');
            ship.log.silly('Here\'s the require error(s): ',e0,e1);
          }
        }
      });

      conf.configExt = ['js','json'].concat(detectedExtens);
      conf.sourceExt = ['js'].concat(detectedExtens);

      return localConfig;
    },

    initialize: function(cb) {
      // Expose self as `ship.modules` (for backwards compatibility)
      ship.modules = ship.hooks.moduleloader;


      return cb();
    },

    configure: function() {
      if (ship.config.moduleLoaderOverride) {
        var override = ship.config.moduleLoaderOverride(ship, this);
        _.extend(this, override);
        if (override.configure) {
          this.configure();
        }
      }
      ship.config.appPath = ship.config.appPath ? path.resolve(ship.config.appPath) : process.cwd();

      _.extend(ship.config.paths, {

        // Configuration
        //
        // For `userconfig` hook
        config: path.resolve(ship.config.appPath, ship.config.paths.config),

        // Server-Side Code
        //
        // For `userhooks` hook
        //hooks: path.resolve(ship.config.appPath, ship.config.paths.hooks),
        
      });
    },

    /**
     * Load user config from app
     *
     * @param {Object} options
     * @param {Function} cb
     */
    loadUserConfig: function (cb) {

      async.auto({
        'config/*': function loadOtherConfigFiles (cb) {
          buildDictionary.aggregate({
            dirname   : ship.config.paths.config || ship.config.appPath + '/config',
            exclude   : ['locales'].concat(_.map(ship.config.moduleloader.configExt, function(item){ return 'local.'+item; })),
            excludeDirs: /(locales|env)$/,
            filter    : new RegExp('(.+)\\.(' + ship.config.moduleloader.configExt.join('|') + ')$'),
            flattenDirectories: !(ship.config.dontFlattenConfig),
            identity  : false
          }, cb);
        },

        'config/local' : function loadLocalOverrideFile (cb) {
          buildDictionary.aggregate({
            dirname   : ship.config.paths.config || ship.config.appPath + '/config',
            filter    : new RegExp('local\\.(' + ship.config.moduleloader.configExt.join('|') + ')$'),
            identity  : false
          }, cb);
        },

        // Load environment-specific config folder, e.g. config/env/development/*
        'config/env/**': ['config/local', function loadEnvConfigFolder (async_data, cb) {
          // If there's an environment already set in ship.config, then it came from the environment
          // or the command line, so that takes precedence.  Otherwise, check the config/local.js file
          // for an environment setting.  Lastly, default to development.
          var env = ship.config.environment || async_data['config/local'].environment || 'development';
          
          buildDictionary.aggregate({
            dirname   : (ship.config.paths.config || ship.config.appPath + '/config') + '/env/' + env,
            filter    : new RegExp('(.+)\\.(' + ship.config.moduleloader.configExt.join('|') + ')$'),
            optional  : true,
            flattenDirectories: !(ship.config.dontFlattenConfig),
            identity  : false
          }, cb);
        }],

        // Load environment-specific config file, e.g. config/env/development.js
        'config/env/*' : ['config/local', function loadEnvConfigFile (async_data, cb) {
          // If there's an environment already set in ship.config, then it came from the environment
          // or the command line, so that takes precedence.  Otherwise, check the config/local.js file
          // for an environment setting.  Lastly, default to development.
          var env = ship.config.environment || async_data['config/local'].environment || 'development';
          buildDictionary.aggregate({
            dirname   : (ship.config.paths.config || ship.config.appPath + '/config') + '/env',
            filter    : new RegExp('^' + env + '\\.(' + ship.config.moduleloader.configExt.join('|') + ')$'),
            optional  : true,
            flattenDirectories: !(ship.config.dontFlattenConfig),
            identity  : false
          }, cb);
        }]

      }, function (err, async_data) {
        if (err) { return cb(err); }
        // Save the environment override, if any.
        var env = ship.config.environment;
        // Merge the configs, with env/*.js files taking precedence over others, and local.js
        // taking precedence over everything
        var config = _.merge(
          async_data['config/*'],
          async_data['config/env/**'],
          async_data['config/env/*'],
          async_data['config/local']
        );
        // Set the environment, but don't allow env/* files to change it; that'd be weird.
        config.environment = env || async_data['config/local'].environment || 'development';
        // Return the user config
        cb(null, config);
      });
    },


    /**
     * Load app hooks
     *
     * @param {Object} options
     * @param {Function} cb
     */
    loadUserHooks: function (cb) {

      async.auto({
        // Load apps from the "api/hooks" folder
        hooksFolder: function(cb) {
          buildDictionary.optional({
            dirname: ship.config.paths.hooks,
            filter: new RegExp('^(.+)\\.(' + ship.config.moduleloader.sourceExt.join('|') + ')$'),

            // Hooks should be defined as either single files as a function
            // OR (better yet) a subfolder with an index.js file
            // (like a standard node module)
            depth: 2
          }, cb);
        },

        // Load package.json files from node_modules to check for hooks
        nodeModulesFolder: function(cb) {
          buildDictionary.optional({
            dirname: path.resolve(ship.config.appPath, 'node_modules'),
            filter: /^(package\.json)$/,
            excludeDirs: /^\./,
            // Look inside namespaced folders e.g. node_modules/@sailsjs/ship-hook-foo
            depth: 3,
            // Don't actually load the files, since malformed once would cause a crash.
            // Just keep track of where they are and we'll load them carefully below
            dontLoad: true
          }, function(err, modules) {
            if (err) {return cb(err);}
            // Now that we have a map of where the package.json files are, flatten that
            // map and load the files carefully.  Map might look something like:
            // { angular2:
            //    { animate: {},
            //      bundles: { web_worker: undefined },
            //      es6: { dev: undefined, prod: undefined },
            //      examples: { router: undefined },
            //      http: {},
            //      'package.json': true,
            //      etc...
            modules = (function flattenDirectories(modules, foundPackageJsons, path, level) {
              foundPackageJsons = foundPackageJsons || {};
              path = path || '';
              level = level || 0;
              // Loop through the keys in the current map object
              Object.keys(modules).forEach(function(identity) {
                // If it represents a package.json file, attempt to load it and, if
                // successful, save it in our set of found files.  If unsuccessful,
                // just ignore it.
                if (identity === 'package.json' && modules[identity] === true) {
                  var filePath = require('path').resolve(ship.config.appPath, 'node_modules', path, identity);
                  try {
                    // Make sure the file isn't cached
                    // TODO -- does this only matter for tests, in which case, fix the tests?
                    var resolved = require.resolve(filePath);
                    if (require.cache[resolved]) {delete require.cache[resolved];}
                    // Attempt to load the package.json file
                    foundPackageJsons[path] = require(filePath);
                  } catch(e) {
                    ship.log.verbose('While searching for installable hooks, found invalid package.json file:', filePath);
                    return;
                  }
                }
                // If the key represents an object, recursively search within it, but only if it's directly
                // under node_modules or under a node_modules/@something (namespaced) folder
                if ('object' === typeof modules[identity] && level === 0 || (level === 1 && path[0] === '@')) {
                  flattenDirectories(modules[identity], foundPackageJsons, path ? path + '/' + identity : identity, level + 1 );
                }
              });
              return foundPackageJsons;
            })(modules);
            return cb(null, modules);
          });
        }
      }, function(err, results) {
        if (err) {return cb(err);}

        // Marshall the hooks by checking that they are valid.  The ones from the
        // api/hooks folder are assumed to be okay, as long as they aren't explicitly turned off.
        var hooks = _.reduce(results.hooksFolder, function(memo, module, identity) {
          if (ship.config.hooks[identity] !== false && ship.config.hooks[identity] !== 'false') {
            memo[identity] = module;
          }
          return memo;
        }, {});

        try {

          _.extend(hooks, _.reduce(results.nodeModulesFolder, function(memo, module, identity) {

            // Hooks loaded from "node_modules" need to have "ship.isHook: true" in order for us
            // to know that they are a ship hook
            if (module.ship && module.ship.isHook) {
              var hookConfig = module.ship;
              
              // Determine the name the hook should be added as
              var hookName;

              if (!_.isEmpty(hookConfig.hookName)) {
                hookName = hookConfig.hookName;
              }
              // If an identity was specified in ship.config.installedHooks, use that
              else if (ship.config.installedHooks && ship.config.installedHooks[identity] && ship.config.installedHooks[identity].name) {
                hookName = ship.config.installedHooks[identity].name;
              }
              // Otherwise use the module name, with namespacing and initial "ship-hook-" stripped off if it exists
              else {
                // Strip off any NPM namespacing and/or ship-hook- prefix
                hookName = identity.replace(/^(@.+?\/)?(ship-hook-)?/, '');
              }
              
              if (ship.config.hooks[hookName] === false || ship.config.hooks[hookName] === 'false') {
                return memo;
              }

              // Allow overriding core hooks
              if (ship.hooks[hookName]) {
                ship.log.verbose('Found hook: `'+hookName+'` in `node_modules/`.  Overriding core hook w/ the same identity...');
              }

              // If we have a hook in api/hooks with this name, throw an error
              if (hooks[hookName]) {
                var err = (function (){
                  var msg =
                  'Found hook: `' + hookName + '`, in `node_modules/`, but a hook with that identity already exists in `api/hooks/`. '+
                  'The hook defined in your `api/hooks/` folder will take precedence.';
                  var err = new Error(msg);
                  err.code = 'E_INVALID_HOOK_NAME';
                  return err;
                })();
                ship.log.warn(err);
                return memo;
              }

              // Load the hook code
              var hook = require(path.resolve(ship.config.appPath, 'node_modules', identity));

              // Set its config key (defaults to the hook name)
              hook.configKey = (ship.config.installedHooks && ship.config.installedHooks[identity] && ship.config.installedHooks[identity].configKey) || hookName;

              // Add this to the list of hooks to load
              memo[hookName] = hook;
              
            }
            return memo;
          }, {}));

          return bindToShip(cb)(null, hooks);

        } catch (e) {
          return cb(e);
        }
      });
    },


    optional: buildDictionary.optional,
    required: buildDictionary.required,
    aggregate: buildDictionary.aggregate,
    exits: buildDictionary.exists
  };

  function bindToShip(cb) {
    return function(err, modules) {
      if (err) {return cb(err);}
      _.each(modules, function(module) {
        // Add a reference to the ship app that loaded the module
        module.ship = ship;
        // Bind all methods to the module context
        _.bindAll(module);
      });
      return cb(null, modules);
    };
  }

  function flattenNamespacedModules (tree) {
    return _.transform(tree, function (result, dir, dirName) {
      if (/^@/.test(dirName)) {
        _.extend(result, _.transform(_.omit(dir, 'identity', 'globalId'), function (result, subdir, subdirName) {
          return result[dirName + '/' + subdirName] = subdir;
        }));
      }
      else {
        result[dirName] = dir;
      }
    });
  }
};
