// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module
var pug = require('pug');
var urlMetadata = require('url-metadata');
//var slack = require('slack-incoming-webhook');
//var send = slack({url: '{https://hooks.slack.com/services/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}'});
//send({"text": "hello"});
//var request = require('request-promise');
//const  {SCOPE, TOKEN, CLIENT_ID, CLIENT_SECRET} = process.env;

//var mongodb = require('mongodb');
//var config = require('../server/config');
var mLab = 'mongodb://' + process.env.CONFIGDBHOST + '/' + process.env.CONFIGDBNAME;
//var MongoClient = mongodb.MongoClient;
//var collection;

var fs = require("fs");
var mongoose = require("mongoose");
mongoose.connect(mLab);
var conn = mongoose.connection;
var bodyParser = require('body-parser');
var shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

// Set process name
process.title = "node-easyrtc";

// Get port or default to 8080
var port = process.env.PORT || 8080;

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(bodyParser.json({limit: '5mb'}));
app.use(serveStatic('server/static', {'index': ['index.html']}));
app.use(express.static('static'));
app.set('view engine', 'pug');
app.set('views', './server/views');
/*app.use('/slack', slack({
scope: 'bot,commands,incoming-webhook',
token: 'fbXTXSVnA5kP72Zgv3vCqsuK',
store: 'data/team.json',
client_id: '215025528775.215697609975',
client_secret: '68f547f14d8d24b90e11061ca514437e'
}));
// handle the "/test" slash commands
slack.on('/test', (payload, bot) => {
console.log("/test command received");
bot.reply('hi adventure corp!');
});*/
/*var options = {
method: 'POST',
uri: 'https://hooks.slack.com/services/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',
form: {
text: 'A message\non several\nlines.',
},
headers: {
'content-type': 'application/json'
}
};
request(options)
.then(function (body) {
console.log("slack " + body);
// Display response content
})
.catch(function (err) {
// Display errors if any
console.log("slack " + err);
});*/

// Start Express http server
var webServer = http.createServer(app).listen(port);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

var myIceServers = [
  {"url":"stun:stun.l.google.com:19302"},
  {"url":"stun:stun1.l.google.com:19302"},
  {"url":"stun:stun2.l.google.com:19302"},
  {"url":"stun:stun3.l.google.com:19302"}
  // {
  //   "url":"turn:[ADDRESS]:[PORT]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // },
  // {
  //   "url":"turn:[ADDRESS]:[PORT][?transport=tcp]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // }
];
easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("demosEnable", false);

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
  easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
    if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
      callback(err, connectionObj);
      return;
    }

    connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

    console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

    callback(err, connectionObj);
  });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
  console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
  easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
  console.log("Initiated");

  rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    console.log("roomCreate fired! Trying to create: " + roomName);

    appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
  });
});

//listen on port
webServer.listen(port, function () {
  console.log('listening on http://localhost:' + port);
});

conn.once("open", function(){

  app.get('/', function (req, res) {
    res.redirect('/room/home');
  });

  app.get('/room/:room', function (req, res) {
    res.render('index', { roomToJoin: req.params.room })
  });

  var imagesSchema = mongoose.Schema({
    room: String,
    src: String,
    position: mongoose.Schema.Types.Mixed,
    rotation: mongoose.Schema.Types.Mixed,
    link: String,
    gif: Boolean
  });
  var image = mongoose.model('image', imagesSchema);

  var locationSchema = mongoose.Schema({
    room: String,
    shortid: String,
    position: mongoose.Schema.Types.Mixed,
    rotation: mongoose.Schema.Types.Mixed
  });
  var location = mongoose.model('location', locationSchema);

  var metadataContentSchema = mongoose.Schema({
    room: String,
    title: String,
    description: String,
    src: String,
    link: String,
    imgPosition: mongoose.Schema.Types.Mixed,
    titlePosition: mongoose.Schema.Types.Mixed,
    descriptionPosition: mongoose.Schema.Types.Mixed,
    rotation: mongoose.Schema.Types.Mixed
  });
  var metadataContent = mongoose.model('metadataContent', metadataContentSchema);

  app.post("/room/:room/*/imageUpload", function(req, res){
    var newImage = new image({ room: req.params.room, src: req.body.src, position: req.body.position, rotation: req.body.rotation, link: req.body.link, gif: req.body.gif});
    newImage.save(function (err, newImage) {
      if (err) return console.error(err);
      console.log("image successfully added to database");
    });
    res.end();
  });

  app.post("/room/:room/imageUpload", function(req, res){
    var newImage = new image({ room: req.params.room, src: req.body.src, position: req.body.position, rotation: req.body.rotation, link: req.body.link, gif: req.body.gif });
    newImage.save(function (err, newImage) {
      if (err) return console.error(err);
      console.log("image successfully added to database");
    });
    res.end();
  });

  app.get("/room/:room/retrieveImages", function(req, res){
    image.find({ room: req.params.room }).exec(function (err, images) {
      if (err) return console.error(err);
      //console.log(images);
      res.send(JSON.stringify(images));
    });
  });

  app.get("/room/:room/*/retrieveImages", function(req, res){
    image.find({ room: req.params.room }).exec(function (err, images) {
      if (err) return console.error(err);
      //console.log(images);
      res.send(JSON.stringify(images));
    });
  });

  app.post("/room/:room/savePosition", function(req, res){
    var newId = shortid.generate();
    var savedLocation = new location({ room: req.params.room, shortid: newId, position: req.body.position, rotation: req.body.rotation });
    savedLocation.save(function (err, savedLocation) {
      if (err) return console.error(err);
      console.log("location successfully added to database");
      res.send(newId);
    });
  });

  app.post("/room/:room/*/savePosition", function(req, res){
    var newId = shortid.generate();
    var savedLocation = new location({ room: req.params.room, shortid: newId, position: req.body.position, rotation: req.body.rotation });
    savedLocation.save(function (err, savedLocation) {
      if (err) return console.error(err);
      console.log("location successfully added to database");
      res.send(newId);
    });
  });

  app.get("/room/:room/loc/:shortid", function(req, res){
    //if(err) return res.send("No location found");
    console.log("shortid is " + req.params.shortid);
    location.findOne({ 'shortid' : req.params.shortid }, function (err, location) {
      if (err) return console.error(err);
      else if (location != null) {
        if (location.room == req.params.room) {
          console.log("location.position " + JSON.stringify(location.position));
          console.log("location.rotation " + JSON.stringify(location.rotation));
          res.render('index', {
            roomToJoin: req.params.room,
            specLocX: location.position.x,
            specLocY: location.position.y,
            specLocZ: location.position.z,
            specRotX: location.rotation.x,
            specRotY: location.rotation.y,
            specRotZ: location.rotation.z
          });
        }
      }
      else {
        console.log("User tried invalid location.");
        res.redirect('/room/'+req.params.room);
      }
    });
  });

  app.get("/room/:room/retrieveMediaCards", function(req, res){
    metadataContent.find({ room: req.params.room }).exec(function (err, mediaCard) {
      if (err) return console.error(err);
      //console.log(images);
      res.send(JSON.stringify(mediaCard));
    });
  });

  app.get("/room/:room/*/retrieveMediaCards", function(req, res){
    metadataContent.find({ room: req.params.room }).exec(function (err, mediaCard) {
      if (err) return console.error(err);
      //console.log(images);
      res.send(JSON.stringify(mediaCard));
    });
  });

  app.post("/room/:room/metadata", function(req, res){
    urlMetadata(req.body.link, {fromEmail: 'discover@adventure.pizza'}).then(
      function (metadata) { // success handler
        var data = {"title":metadata["og:title"], "description":metadata["og:description"], "image":metadata["og:image"], "link":req.body.link};
        var savedMetadata = new metadataContent({
          room: req.params.room,
          title: data.title,
          description: data.description,
          src: data.image,
          link: req.body.link,
          imgPosition: req.body.imgPosition,
          titlePosition: req.body.titlePosition,
          descriptionPosition: req.body.descriptionPosition,
          rotation: req.body.rotation
        });
        savedMetadata.save(function (err, savedMetadata) {
          if (err) return console.error(err);
          console.log("metadata successfully added to database");
        });
        res.send(data);
      },
      function (error) { // failure handler
        console.log(error)
      });
    });

    app.post("/room/:room/*/metadata", function(req, res){
      urlMetadata(req.body.link, {fromEmail: 'discover@adventure.pizza'}).then(
        function (metadata) { // success handler
          var data = {"title":metadata["og:title"], "description":metadata["og:description"], "image":metadata["og:image"], "link":req.body.link};
          var savedMetadata = new metadataContent({
            room: req.params.room,
            title: data.title,
            description: data.description,
            src: data.image,
            link: req.body.link,
            imgPosition: req.body.imgPosition,
            titlePosition: req.body.titlePosition,
            descriptionPosition: req.body.descriptionPosition,
            rotation: req.body.rotation
          });
          savedMetadata.save(function (err, savedMetadata) {
            if (err) return console.error(err);
            console.log("metadata successfully added to database");
          });
          res.send(data);
        },
        function (error) { // failure handler
          console.log(error)
        });
      });

      app.get('*', function (req, res) {
        res.redirect('/room/home');
      });

    });
