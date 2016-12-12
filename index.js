var express = require('express'),
    app = express(),
    _ = require('lodash'),
    config = require('./config'),
    concur = require('concur-platform'),
    foursquare = require('node-foursquare-venues')('QIWD0D1VYJZKBLV4V1LR334C3223DFMT5D1P0NZ3TJY42XYZ', 'U3I34QSDRZKRBLMXLKQZGTYVNRQNEERKN3KEBYVX4SEOCVPO', '20161212', 'foursquare'),
    entries = [],
    venues = {
      items: []
    };

app.set('port', (process.env.PORT || 5000));


function fetchEntires(onComplete) {
  entries = [];
  concur.oauth.native(config.concur)
  .then(function(token) {
    concur.entries.get({
      oauthToken: token.value
    })
    .then (function (data) {
      data.Items.forEach(function (item) {
        entries.push({
          location: item.Custom1,
          region: item.Custom2,
          venue: item.Custom3,
          postal: item.Custom4,
          amount: item.PostedAmount
        });
      });

      onComplete();
    });
  })
  .fail(function(error) {
    console.log(error);
  });
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send('Hello world !');
});

app.get('/venues', function (req, res) {

  var query = req.query.query,
      near = req.query.near;

  if (!query || !near) {
    res.status(404).send();
  }

  venues = _.extend({}, {
    items: []
  });

  fetchEntires( function () {
    foursquare.venues.search({
    intent: 'browse',
    query: query,
    near: near,
    limit: 5
  }, function (error, data) {

    if (error) {
      console.log(error);
      res.status(400).send();
    }

    data.response.venues.forEach( function (venue) {

      for (var i = 0; i < entries.length; i++) {
        console.log( entries[i].postal.Value, venue.location.postalCode);
        if( entries[i].postal.Value == venue.location.postalCode ) {
          venues.items.push({
            address: venue.location.formattedAddress,
            postal: venue.location.postalCode,
            location: {
              lat: venue.location.lat,
              lng: venue.location.lng
            }
          });
        }
      };

    });

    venues.geocode = data.response.geocode;

    res.json(venues);

  });


  });

});

app.get('/entries', function (req, res) {
  res.json(entries);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});