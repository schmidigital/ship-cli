#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
    syncExec = require('sync-exec'),
    colors = require('colors'),
    util  = require('util'),
    fs = require('fs'),
    _ = require('lodash'),
    require('shelljs/global'),
    NOOP = function() {};

var appPath = process.cwd();

/**
 * Local Commands
 * 
 * TODO: Really check, if command is available!
 */
var dockercompose = syncExec('which docker-compose').stdout.replace(/(\r\n|\n|\r)/gm,""),
    docker = syncExec('which dockers').stdout.replace(/(\r\n|\n|\r)/gm,"")


/*var config = require( __dirname + "/config/config.json")
var ship_config;

if(fs.existsSync(__dirname + "/.ship.json")) {
  console.log("Ship config exists. nice.")
  ship_config = require( __dirname + "/.ship.json")
} 
else {
  console.log("Ship config does not yet exist!")
}

// Set remote Origin
syncExec("git remote set-url origin " + config.repo);
syncExec("git remote add upstream " + require( __dirname + "/package.json").repository);
*/

program
  .version('0.0.6')
  .option('-C, --chdir <path>', 'change the working directory')
  .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
  .option('-T, --no-tests', 'ignore test hook')


program
  .command('exec <container> <cmd>')
  .alias('ex')
  .description('execute the given remote cmd inside a container')
  .option("-e, --exec_mode <mode>", "Which exec mode to use")
  .action(function(container, cmd){

    execContainerCommand(container, cmd)

  }).on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ ship exec "docker-compose up"');
    console.log();
  });


program
  .command('logs [container]')
  .alias('l')
  .description('output the logs of all container or of the given container')
  .action(function(container, cmd){

    if (container) {
      shell(dockercompose + " logs " + container)
    }
    else {
      shell(dockercompose + " logs")
    }

  }).on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ ship exec "docker-compose up"');
    console.log();
  });



program
  .command('start')
  .alias('s')
  .description('starts the given template in the given environment')
  .option("-b --branch <branch>", "Which branch to use. (e.g. /feature/vs-13-slider")
  .option("-m --migrate <migrate>", "Wheter to migrate database or not.")
  .action(require('./ship-start'))
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ ship start -e local');
    console.log('    $ ship start -e dev');
    console.log();
  });


program
  .command('down [container]')
  .alias('d')
  .description('stops & removes all containers or a specific one given in container argument.')
  .action(require('./ship-down'))
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ ship destroy');
    console.log('    $ ship destroy web');
    console.log();
  });


program
  .command('enter [container]')
  .alias('e')
  .description('enter a specific container.')
  .action(function(container){

    console.log("Enter", container)
    
    execContainerCommand(container, "bash")

  }).on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ ship enter web');
    console.log('    $ ship enter db');
    console.log();
  });


program
  .command('init <type>')
  .alias('i')
  .description('initialize a project using a profile, e.g. wordpress, magento, nodejs, html, php')


program
  .command('nginx <command>')
  .description('Refresh the nginx config')
  .action(function(command){
    switch (command) {
      case "setup": {
        generate_nginx();
        execContainerCommand("web", "nginx -s reload")
      }
    }
  }).on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ ship destroy');
    console.log('    $ ship destroy web');
    console.log();
  });

program
  .command('*')
  .action(function() {
    program.outputHelp();
  })


program.parse(process.argv)


if (!process.argv.slice(2).length) {
    program.help();
}
