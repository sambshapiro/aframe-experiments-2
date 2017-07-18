// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module
var pug = require('pug');

//var mongodb = require('mongodb');
var config = require('../server/config');
var mLab = 'mongodb://' + config.db.host + '/' + config.db.name;
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
    link: String
  });
  var image = mongoose.model('image', imagesSchema);

  var locationSchema = mongoose.Schema({
    room: String,
    shortid: String,
    position: mongoose.Schema.Types.Mixed,
    rotation: mongoose.Schema.Types.Mixed
  });
  var location = mongoose.model('location', locationSchema);

  app.post("/room/:room/*/imageUpload", function(req, res){
    var newImage = new image({ room: req.params.room, src: req.body.src, position: req.body.position, rotation: req.body.rotation, link: req.body.url });
    newImage.save(function (err, newImage) {
      if (err) return console.error(err);
      console.log("image successfully added to database");
    });
    res.end();
  });

  app.post("/room/:room/imageUpload", function(req, res){
    var newImage = new image({ room: req.params.room, src: req.body.src, position: req.body.position, rotation: req.body.rotation, link: req.body.url });
    newImage.save(function (err, newImage) {
      if (err) return console.error(err);
      console.log("image successfully added to database");
    });
    res.end();
  });

  app.get("/room/:room/*/retrieveImages", function(req, res){
    image.find({ room: req.params.room }).exec(function (err, images) {
      if (err) return console.error(err);
      //console.log(images);
      res.send(JSON.stringify(images));
    });
  });

  app.get("/room/:room/retrieveImages", function(req, res){
    image.find({ room: req.params.room }).exec(function (err, images) {
      if (err) return console.error(err);
      //console.log(images);
      res.send(JSON.stringify(images));
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
    });
  });
});
