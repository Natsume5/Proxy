var http = require('http'),
  url = require('url'),
  cluster = require('cluster'),
  fs = require('fs'),
  numCPUs = require('os').cpus().length;
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  http.createServer(function(request, response) {
    var ph = url.parse(request.url);
    var options = {
      port: ph.port,
      hostname: ph.hostname,
      method: request.method,
      path: ph.path,
      headers: request.headers
    };
    var proxyRequest = http.request(options);
      proxyRequest.on('response', function(proxyResponse) {
        proxyResponse.on('data', function(chunk) {
          response.write(chunk, 'binary');
        });
        proxyResponse.on('end', function() { response.end(); } );
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
      });
    request.on('data', function(chunk) {
      proxyRequest.write(chunk, 'binary');
    });
    request.on('end', function() { proxyRequest.end(); } );
    var ip = request.connection.remoteAddress;
    var address = request.url;
    var date = new Date();
    var date_now = date.toJSON().slice(0, 10);
    var time_now = date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    var data = '[ '+ date_now + ' ' + time_now + ' ] ' + ip + ' ' + options.method + ' ' + address;
    fs.appendFile('log.txt', data + '\n', function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }).listen(8000, '127.0.0.1' );
}