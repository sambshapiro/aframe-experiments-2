// Load required modules
//
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module
var pug = require('pug');
var urlMetadata = require('url-metadata');

//var mongodb = require('mongodb');
//var config = require('../server/config');
var mLab = 'mongodb://' + process.env.CONFIGDBHOST + '/' + process.env.CONFIGDBNAME;
//var MongoClient = mongodb.MongoClient;
//var collection;

var fs = require("fs");
var request = require("request");
var mongoose = require("mongoose");
mongoose.connect(mLab);
var conn = mongoose.connection;
var bodyParser = require('body-parser');
var shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
const s3Stream = require('s3-upload-stream')(new aws.S3());
var webshot = require('webshot');

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

//MONGOOSE SCHEMA
var roomSchema = mongoose.Schema({
  roomName: String,
  users: [String],
  numUsers: Number
});
var room = mongoose.model('room', roomSchema);

var imagesSchema = mongoose.Schema({
  room: String,
  src: String,
  position: mongoose.Schema.Types.Mixed,
  rotation: mongoose.Schema.Types.Mixed,
  link: String,
  gif: Boolean
});
var image = mongoose.model('image', imagesSchema);

var modelsSchema = mongoose.Schema({
  room: String,
  obj: String,
  mtl:  String,
  position: mongoose.Schema.Types.Mixed,
  rotation: mongoose.Schema.Types.Mixed,
  link: String
});
var model = mongoose.model('model', modelsSchema);

var messageSchema = mongoose.Schema({
  room: String,
  message: String,
  position: mongoose.Schema.Types.Mixed,
  rotation: mongoose.Schema.Types.Mixed
});
var message = mongoose.model('message', messageSchema);

var locationSchema = mongoose.Schema({
  room: String,
  shortid: String,
  position: mongoose.Schema.Types.Mixed,
  rotation: mongoose.Schema.Types.Mixed
});
var location = mongoose.model('location', locationSchema);

var mediaCardSchema = mongoose.Schema({
  room: String,
  title: String,
  description: String,
  src: String,
  link: String,
  position: mongoose.Schema.Types.Mixed,
  rotation: mongoose.Schema.Types.Mixed
});
var mediaCard = mongoose.model('mediaCard', mediaCardSchema);

//ROUTES
conn.once("open", function(){
  
  //when someone enters a room, keep a record of it in database
  easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
    console.log("someone joined room " + roomName + " with ID " + connectionObj.getEasyrtcid());
    connectionObj.getApp().getRoomOccupantCount(roomName, function(err,clientCount) {
      console.log("room count is now " + clientCount);
    });
    room.find({ roomName: roomName }).exec(function (err, room_found) {
      if (err) return console.error(err);
      //if room does not exist (has never been created before)
      if (room_found.length == 0) {
        console.log("room doesn't exist; adding it")
        var newRoom = new room({ roomName: roomName, users: [connectionObj.getEasyrtcid()], numUsers: 1 });
        newRoom.save(function (err, newRoom) {
          if (err) return console.error(err);
          console.log(newRoom);
        });
      }
      //if room exists
      else {
        room_found[0].users.push(connectionObj.getEasyrtcid());
        room_found[0].numUsers += 1;
        room_found[0].save(function(err, updatedRoom) {
          console.log(updatedRoom);
        });
      }
    });
  });

  //when someone leaves a room, keep a record of it in database
  easyrtc.events.on("roomLeave", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] JUST LEFT ROOM " + roomName);
    easyrtc.events.defaultListeners.roomLeave(connectionObj, roomName, roomParameter, callback);
    room.find({ roomName: roomName }).exec(function (err, room_found) {
      if (err) return console.error(err);
      //if room does not exist... some error function
      if (room_found.length == 0) {
        console.log("ERROR someone left a room that doesn't exist")
      }
      //if room exists
      else {
        var index = room_found[0].users.indexOf(connectionObj.getEasyrtcid());
        room_found[0].users.splice(index, 1);
        room_found[0].numUsers -= 1;
        room_found[0].save(function(err, updatedRoom) {
          console.log(updatedRoom);
        });
      }
    });
  });

  app.get('/roomCountData', function (req, res) {
    var data = { "roomNames": [], "roomCounts": [] };
    room.
      find( { numUsers: { $gt: 0 } } ).
      sort({ numUsers: -1 }).
      select({ _id: 0, roomName: 1, numUsers: 1 }).
      exec(function(err, rooms) {
        for (var i = 0; i < rooms.length; i++) {
          data.roomNames.push(rooms[i].roomName);
          data.roomCounts.push(rooms[i].numUsers);
        }
        res.send(data);
      });
  });

  app.get('/', function (req, res) {
    res.redirect('/room/home');
  });

  app.get('/room/:room', function (req, res) {
    image.find({ room: req.params.room }).exec(function (err, images) {
      if (err) return console.error(err);
      mediaCard.find({ room: req.params.room }).exec(function(err,mediaCards) {
        if (err) return console.error(err);
        message.find({ room: req.params.room }).exec(function(err,messages) {
          if (err) return console.error(err);
          room.
            find( { numUsers: { $gt: 0 } } ).
            sort({ numUsers: -1 }).
            select({ _id: 0, roomName: 1, numUsers: 1 }).
            exec(function(err, rooms) {
              res.render('index', { roomToJoin: req.params.room, roomsToShow: rooms, imagesToLoad: images, mediaCardsToLoad: mediaCards, messagesToLoad: messages })
            });
        });
      });
    });
  });

  app.post("/room/:room/*/messagePosted", function(req, res){
    var newMessage = new message({ room: req.params.room, message: req.body.message, position: req.body.position, rotation: req.body.rotation});
    newMessage.save(function (err, newMessage) {
      if (err) return console.error(err);
      console.log("message successfully added to database");
    });
    res.end();
  });

  app.post("/room/:room/messagePosted", function(req, res){
    var newMessage = new message({ room: req.params.room, message: req.body.message, position: req.body.position, rotation: req.body.rotation});
    newMessage.save(function (err, newMessage) {
      if (err) return console.error(err);
      console.log("message successfully added to database");
    });
    res.end();
  });

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

  app.post("/room/:room/*/modelUpload", function(req, res){
    var newModel = new model({ room: req.params.room, obj: req.body.obj, mtl: req.body.mtl, position: req.body.position, rotation: req.body.rotation, link: req.body.link});
    newModel.save(function (err, newModel) {
      if (err) return console.error(err);
      console.log("model successfully added to database");
    });
    res.end();
  });

  app.post("/room/:room/modelUpload", function(req, res){
    var newModel = new model({ room: req.params.room, obj: req.body.obj, mtl: req.body.mtl, position: req.body.position, rotation: req.body.rotation, link: req.body.link});
    newModel.save(function (err, newModel) {
      if (err) return console.error(err);
      console.log("model successfully added to database");
    });
    res.end();
  });

  //TODO add serverside double-check to make sure filetype is image or allowed media type
  app.get('/sign-s3', (req, res) => {
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const fileType = req.query['file-type'];
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Expires: 60,
      StorageClass: "REDUCED_REDUNDANCY",
      ContentType: fileType,
      ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
      if(err){
        console.log(err);
        return res.end();
      }
      const returnData = {
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
      };
      res.write(JSON.stringify(returnData));
      res.end();
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
          image.find({ room: req.params.room }).exec(function (err, images) {
            if (err) return console.error(err);
            mediaCard.find({ room: req.params.room }).exec(function(err,mediaCards) {
              if (err) return console.error(err);
              message.find({ room: req.params.room }).exec(function(err,messages) {
                if (err) return console.error(err);
                room.
                find( { numUsers: { $gt: 0 } } ).
                sort({ numUsers: -1 }).
                select({ _id: 0, roomName: 1, numUsers: 1 }).
                exec(function(err, rooms) {
                  res.render('index', {
                  roomToJoin: req.params.room,
                  roomsToShow: rooms,
                  imagesToLoad: images,
                  messagesToLoad: messages,
                  mediaCardsToLoad: mediaCards,
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
          });
        }
      }
      else {
        console.log("User tried invalid location.");
        res.redirect('/room/'+req.params.room);
      }
    });
  });

  app.post("/room/:room/metadata", function(req, res){
    urlMetadata(req.body.link, {fromEmail: 'discover@adventure.pizza'}).then(
      function (metadata) { // success handler
        var data = {"title":metadata["og:title"], "description":metadata["og:description"], "image":metadata["og:image"], "link":req.body.link};
        var fileName = shortid.generate();
        var upload = s3Stream.upload({
          Bucket: S3_BUCKET,
          Key: fileName,
          ACL: 'public-read',
          StorageClass: "REDUCED_REDUNDANCY",
          ContentType: "binary/octet-stream"
        });
        var options = {
          url: data.image,
          strictSSL: false,
          secureProtocol: 'TLSv1_method'
        }
        request.get(options)
        .on('error', function(err) {
          console.log(err)
        })
        .pipe(upload);
        upload.on('uploaded', function (details) {
          data.image = "https://s3.amazonaws.com/" + S3_BUCKET + "/" + fileName;
          var savedMediaCard = new mediaCard({
            room: req.params.room,
            title: data.title,
            description: data.description,
            src: data.image,
            link: req.body.link,
            position: req.body.position,
            rotation: req.body.rotation
          });
          savedMediaCard.save(function (err, savedMediaCard) {
            if (err) return console.error(err);
            console.log("media card successfully added to database");
          });
          data.image = savedMediaCard.src;
          res.send(data);
        });
      },
      function (error) { // failure handler
        console.log(error)
      });
    });

    app.post("/room/:room/*/metadata", function(req, res){
      urlMetadata(req.body.link, {fromEmail: 'discover@adventure.pizza'}).then(
        function (metadata) { // success handler
          var data = {"title":metadata["og:title"], "description":metadata["og:description"], "image":metadata["og:image"], "link":req.body.link};
          var fileName = shortid.generate();
          var upload = s3Stream.upload({
            Bucket: S3_BUCKET,
            Key: fileName,
            ACL: 'public-read',
            StorageClass: "REDUCED_REDUNDANCY",
            ContentType: "binary/octet-stream"
          });
          var options = {
            url: data.image,
            strictSSL: false,
            secureProtocol: 'TLSv1_method'
          }
          request.get(options)
          .on('error', function(err) {
            console.log(err)
          })
          .pipe(upload);
          upload.on('uploaded', function (details) {
            data.image = "https://s3.amazonaws.com/" + S3_BUCKET + "/" + fileName;
            var savedMediaCard = new mediaCard({
              room: req.params.room,
              title: data.title,
              description: data.description,
              src: data.image,
              link: req.body.link,
              position: req.body.position,
              rotation: req.body.rotation
            });
            savedMediaCard.save(function (err, savedMediaCard) {
              if (err) return console.error(err);
              console.log("media card successfully added to database");
            });
            data.image = savedMediaCard.src;
            res.send(data);
          });
        },
        function (error) { // failure handler
          console.log(error)
        });
      });

      app.get('*', function (req, res) {
        res.redirect('/room/home');
      });

    });
