
var http = require('http');

process.on('SIGINT', function() {
  console.log('Child app has caught SIGINT');
});

var pmx = require('../../..').init();
var pmx = require('../../..').init();
var pmx = require('../../..').init();

var server = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('hey');
}).listen();
