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

app.get('/venues', function (req, res, next) {

  var query = req.query.query,
      near = req.query.near,
      limit = req.query.limit  || 50,
      amount = req.query.amount,
      fsOpts = {
        intent: 'browse'
      };

  if (!near) {
    if (req.query.ll) {
      fsOpts.ll = req.query.ll;
      fsOpts.intent = 'checkin';
    } else {
      res.status(400).send();
    }
  } else {
    fsOpts.near = near;
  }

  fsOpts.query = query;

  venues = _.extend({}, {
    items: []
  });

  fetchEntires( function () {
    foursquare.venues.search(fsOpts, function (error, data) {

    if (error) {
      res.status(400).send('fail');
    }

    if (_.isEmpty(data.response)) {
      console.log("return");
      return;
    }

    data.response.venues.forEach( function (venue) {

      var visits = 0,
          amounts = [],
          avg = 0,
          min = 0,
          max = 0,
          total = 0;

      for (var i = 0; i < entries.length; i++) {

        if( entries[i].postal.Value == venue.location.postalCode ) {
          visits += 1;
          total += entries[i].amount;
          amounts.push(entries[i].amount);
        }

      };

      if (total) {
        avg = total / visits;
      }

      if (!_.isEmpty(amounts) ) {
        min = _.min(amounts);
        max = _.max(amounts);
      }

      venues.items.push({
        name: venue.name,
        address: venue.location.formattedAddress,
        postal: venue.location.postalCode,
        location: {
          lat: venue.location.lat,
          lng: venue.location.lng
        },
        visits: visits,
        amount: {
          avg: avg,
          min: min,
          max: max
        }

      });

    });

    venues.items.sort(function(item1, item2) {
      if (item1.visits > item2.visits) {
        return -1;
      }

      if (item1.visits < item2.visits) {
        return 1;
      }

      return 0;
    });

    if (amount) {
      venues.items = venues.items.filter(function (item) {
        return item.amount.min < amount;
      });
    }

    if (limit) {
      venues.items.splice(limit);
    }

    venues.geocode = data.response.geocode;

    res.json(venues);

  });


  });

});

app.get('/entries', function (req, res) {
  fetchEntires(function() {
    res.json(entries);
  })

});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});