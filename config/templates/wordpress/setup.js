#!/usr/bin/env node
var spawnAsync = require('child_process').spawnAsync,
    spawnSync = require('child_process').spawnSync,
    spawnargs = require('spawn-args'),
    syncExec = require('sync-exec'),
    fs = require('fs');



var project_dir = process.argv[2]
var www_dir = project_dir + "/www";
var script_dir = __dirname;
var branch = process.argv[3]
var url = process.env.URL;


try {
  process.chdir(project_dir);
  console.log('New directory: ' + process.cwd());
}
catch (err) {
  console.log('chdir: ' + err);
}

function shell(cmd, sync) {

  var full_command = spawnargs(cmd);

  var command = full_command[0];
  var args = full_command;
  args.shift();


  process.stdin.pause();
  process.stdin.setRawMode(false);

  var spawn = spawnAsync;
  var ch;

  if ("sync == true") {
    ch = spawnSync(command, args, {
      stdio: [0, 1, 2]
    });
  }
  else {
    ch = spawnAsync(command, args, {
      stdio: [0, 1, 2]
    });
    ch.on('exit', function() {
      process.stdin.setRawMode(true);
    });

    ch.on('err', function() {
      console.log("Error!".red)
    });
  }

}


console.log("create config.json");
var config = JSON.parse(require('fs').readFileSync(project_dir + '/config.json.sample', 'utf8'));
config.url = (branch == "master" ? "www" + "." + url : branch + "." + url);

var outputFilename = project_dir + '/config.json';

fs.writeFileSync(outputFilename, JSON.stringify(config, null, 4)); 


console.log("bower install")
shell("bower install", true);

console.log("npm install")
shell("npm install", true);

console.log("Using gulp magic to create css and js for live")
shell("gulp dist", true);

console.log(www_dir)

try {
  process.chdir(www_dir);
  console.log('New directory: ' + process.cwd());
}
catch (err) {
  console.log('chdir: ' + err);
}

console.log("Setup Wordpress Config");

process.env.WORDPRESS_DB_NAME = process.env.WORDPRESS_DB_NAME + "." + branch;

shell( script_dir + "/wp_config.sh")



console.log("Import current dump");
console.log(syncExec("wp db reset --yes").stdout)

var database_dir = project_dir + '/database/';

fs.readdir( database_dir,function(err,files){
    if(err) throw err;
    files.forEach(function(file){
      console.log(syncExec("wp db import " + database_dir + file).stdout)
    });

    console.log(syncExec('wp option update siteurl "http://"' + config.url).stdout)
    console.log(syncExec('wp option update home "http://"' + config.url).stdout)

});


//spawn( __dirname + "/tools/wp_config.sh")
