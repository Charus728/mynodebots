
// Basic XMPP bot example for emobile using node.js
// To use:
//  1. Set config variables
//  2. Run `node server.js`
//  3. Send a message like "!weather 94085" in the room with the bot
//  4. Emobile commands -

var request = require('request'); // github.com/mikeal/request
var sys = require('sys');
var util = require('util');
var xmpp = require('node-xmpp');
/*
var soap = require('soap');
var apiWSDL = 'http://rc.emobileindia.com/ws/p/network.asmx?WSDL';
var key = '';
*/

//var express = require('express')
//var app = express()
/*
app.get('/', function (req, res) {
  res.send('Hello Digital Ocean!')
})

app.listen(80, function () {
  console.log('Magic is happening on port 80!')
})
*/

// Config (get details from https://www.hipchat.com/account/xmpp)
var jid = "emobile@im.praan.nl"
var password = ""
var room_jid = "emobile@im.praan.nl"
var room_nick = "Xxx Xxx"

var cl = new xmpp.Client({
  jid: jid + '/bot',
  password: password
});

// Log all data received
//cl.on('data', function(d) {
//  util.log("[data in] " + d);
//});

// Once connected, set available presence and join room
cl.on('online', function() {
  util.log("We're online!");

  // set ourselves as online
  cl.send(new xmpp.Element('presence', { type: 'available' }).
    c('show').t('chat')
   );

  // join room (and request no chat history)
  cl.send(new xmpp.Element('presence', { to: room_jid+'/'+room_nick }).
    c('x', { xmlns: 'http://jabber.org/protocol/muc' })
  );

  // send keepalive data or server will disconnect us after 150s of inactivity
  setInterval(function() {
    cl.send(' ');
  }, 30000);
});

cl.on('stanza', function(stanza) {
  // always log error stanzas
  if (stanza.attrs.type == 'error') {
    util.log('[error] ' + stanza);
    return;
  }

  // ignore everything that isn't a room message
  if (!stanza.is('message') || !stanza.attrs.type == 'groupchat') {
    return;
  }

  // ignore messages we sent
  if (stanza.attrs.from == room_jid+'/'+room_nick) {
    return;
  }

  var body = stanza.getChild('body');
  // message without body is probably a topic change
  if (!body) {
    return;
  }
  var message = body.getText();

  // Look for messages like "!weather 94085"
  if (message.indexOf('!weather') === 0) {
    var search = message.substring(9);
    util.log('Fetching weather for: "' + search + '"');

    // hit Yahoo API
    var query = 'select item from weather.forecast where location = "'+search+'"';
    var uri = 'http://query.yahooapis.com/v1/public/yql?format=json&q='+encodeURIComponent(query);
    request({'uri': uri}, function(error, response, body) {
      body = JSON.parse(body);
      var item = body.query.results.channel.item;
      if (!item.condition) {
        response = item.title;
      } else {
        response = item.title+': '+item.condition.temp+' degrees and '+item.condition.text;
      }

      // send response
      cl.send(new xmpp.Element('message', { to: room_jid+'/'+room_nick, type: 'groupchat' }).
        c('body').t(response)
      );
    });
  }
});
/*
//based on searching brickset.com
var minYear = 1950;
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function setKey(k) {   key = k;}

function getRandomSet() {
    //first, determine the year
    year = getRandomInt(minYear, (new Date()).getFullYear());
    console.log('chosen year', year);
    var p = new Promise(function(resolve, reject) {
        soap.createClient(apiWSDL, function(err, client) {
            if(err) throw new Error(err);
            var args = {
                apiKey:key,
                userHash:'',
                query:'',
                theme:'',
                subtheme:'',
                setNumber:'',
                year:year,
                owned:'',
                wanted:'',
                orderBy:'',
                pageSize:'2000',
                pageNumber:'1',
                userName:''
            }
//client.checkBalance
            client.getSets(args, function(err, result) {
                if(err) reject(err);
                if(!result) {
                    return getRandomSet();
                }

                var sets = result.getSetsResult.sets;
                console.log('i found '+sets.length+' results');
                if(sets.length) {
                    var chosen = getRandomInt(0, sets.length-1);
                    var set = sets[chosen];
                    // now that we have a set, try to get more images
                    if(set.additionalImageCount > 0) {
                        client.getAdditionalImages({apiKey:key, setID:set.setID}, function(err, result) {
                            if(err) reject(err);
                            console.log('i got more images', result);
                            set.additionalImages = result;
                            resolve(set);
                        });
                    } else {
                        resolve(set);
                    }
                }
            });
        });


    });

    return p;

}

exports.setKey = setKey;
exports.getRandomSet = getRandomSet;
*/
