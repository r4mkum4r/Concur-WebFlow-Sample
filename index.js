var express = require('express'),
    app = express(),
    config = require('./config'),
    concur = require('concur-platform'),
    foursquare = require('node-foursquare-venues')('QIWD0D1VYJZKBLV4V1LR334C3223DFMT5D1P0NZ3TJY42XYZ', 'U3I34QSDRZKRBLMXLKQZGTYVNRQNEERKN3KEBYVX4SEOCVPO', '20161212', 'foursquare'),
    entries = [];

app.set('port', (process.env.PORT || 5000));

concur.oauth.native(config.concur)
.then(function(token) {

  concur.entries.get({
    oauthToken: token.value
  })
  .then (function (data) {
    console.log(data.Items[0]);
  })

})
.fail(function(error) {
  console.log('logon error');
  console.log(error);
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send('test test');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});