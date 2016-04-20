var spawnargs = require("spawn-args"),
    spawn = require('child_process').spawn

module.exports = function(cmd) {  
  
  var full_command = spawnargs(cmd);

  var command = full_command[0];
  var args = full_command;
  args.shift();

  process.stdin.pause();
  process.stdin.setRawMode(false);

  var ch = spawn(command, args, {
    stdio: [0, 1, 2]
  });

  ch.on('exit', function() {
    //console.log("Programm exited!")
    process.stdin.setRawMode(true);
  });

  ch.on('err', function() {
    console.log("Error!".red)
  });
}
