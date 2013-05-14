module.exports = {
  redisClient: function(redisUrl) {
    var url = require('url');
    var redis = require('redis');

    var parsedUrl = url.parse(redisUrl || 'redis://127.0.0.1:6379');
    var client = redis.createClient(parseInt(parsedUrl.port || '6379', 10), parsedUrl.hostname);

    var password = parsedUrl.auth;
    var pathName = parsedUrl.pathname;

    if (password) {
      if (password.indexOf(':') != -1) {
        password = password.substr(password.indexOf(':') + 1);
      }

      client.auth(password, function(err) {
        console.log('Failed to authenticate: ' + err);
        process.exit(1);
      });
    }

    if (pathName && pathName.length > 1) {
      var db = parseInt(pathName.substr(1), 10);
      client.select(db, function(err) {
        if (err) {
          console.log('Error selecting datbase "' + db + '": ' + err);
          process.exit(2);
        }
      });
    }

    return client;
  }
};
