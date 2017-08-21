var reader = new FileReader();
var objData;
var objFile;
var mtlFile;

$(document).ready(function(){
  document.getElementById("media_input").addEventListener("change", function() {
    $("#link_input_div").show();
  });

  document.getElementById("mtl_input").addEventListener("change", function() {
    var file = document.getElementById("mtl_input").files[0];
    var extension = file.name.split('.').pop().toLowerCase();  //file extension from input file
    reader.onload = function() {
      if (extension === 'mtl') {
        objData.mtl = reader.result;
        mtlFile = file;
      };
      objUpload();
    };
    if (file) {
      reader.readAsDataURL(file);
    };
  });

});

function uploadMedia() {
  $("#media_input").click();
}

function mtlUploadPrompt() {
  $("#mtl_input").click();
}

function useSiteContent(link) {
  console.log("sending link to server: " + link);
  var placementCoords = getPlacementPosition();
  var position = placementCoords.position;
  var rotation = placementCoords.rotation;

  var data = {'link':link, 'position':position, 'rotation':rotation};
  $.ajax({
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    url: location.protocol + '//' + location.host + location.pathname + '/metadata',
    success: function(data) {
      console.log('successly received scraped content from server');
      addScrapedContent(data.title, data.description, data.image, data.link, position, rotation);
      console.log("broadcasting data");
      var broadcastData = {'title':data.title, 'description':data.description, 'image':data.image, 'link':link, 'position':position, 'rotation':rotation};
      NAF.connection.broadcastDataGuaranteed('mediaCardPlaced', JSON.stringify(broadcastData));
    }
  });
}

function validateLink(link) {
  //og: /((ftp|http|https):\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var urlWithHeader = /((ftp|http|https):\/\/)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var urlWithoutHeader = /(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

  if (urlWithHeader.test(link)) return 0;
  else if (urlWithoutHeader.test(link)) return 1;
  else return 9;
}

function checkLink(callback) {
  if ( callback == mediaLoader ) {
    console.log("callback is mediaLoader");
    var el = document.getElementById("appendedLink");
  }
  else if ( callback == useSiteContent ) {
    console.log("callback is useSiteContent");
    var el = document.getElementById("search-box");
  }
  else console.error("check link function");
  var link = el.value;
  if (validateLink(link)==0) {
    callback(link);
    el.value = "";
    document.getElementById("search-box").style.backgroundColor = "rgba(255,255,255,.5)";
  }
  else if (validateLink(link)==1) {
    callback("http://" + link);
    el.value = "";
    document.getElementById("search-box").style.backgroundColor = "rgba(255,255,255,.5)";
  }
  else {
    console.log("not a valid url; posting as message instead");

    var placementCoords = getPlacementPosition();
    var position = placementCoords.position;
    var rotation = placementCoords.rotation;

    addMessageToScene(el.value, position, rotation);
    var data = {message: el.value, position: position, rotation: rotation};
    el.value = "";

    NAF.connection.broadcastDataGuaranteed('messagePosted', JSON.stringify(data));

    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: location.protocol + '//' + location.host + location.pathname + '/messagePosted',
      success: function(data) {
      }
    });
    /*el.value = "Invalid URL.";
    if ( callback == useSiteContent ) {
      document.getElementById("search-box").style.backgroundColor = "rgba(255,0,0,.5)";
    }*/
  }
}

function mediaLoader(link) {
  $("#link_input_div").hide();
  var placementCoords = getPlacementPosition();
  var position = placementCoords.position;
  var rotation = placementCoords.rotation;

  //var files = document.getElementById("media_input").files;
  var file = document.getElementById("media_input").files[0];
  var filetype = file.type;

  reader.onload = function() {

    console.log("file type " + filetype);

    if (filetype.includes('image')){
      //adds image to scene for yourself
      addImageToScene(reader.result, position, rotation, link, filetype == 'image/gif');

      var data = { src: reader.result, position: position, rotation: rotation, link: link, gif: filetype == 'image/gif'};
      //console.log("broadcasting data");
      //adds image to scene for others in room NOW
      NAF.connection.broadcastDataGuaranteed('imagePlaced', JSON.stringify(data));

      //adds image to scene for others in room LATER
      awsGetSignedRequest(file, data);
    }

    //if not an image/gif
    else {
      console.log("not image/gif");
      var extension = file.name.split('.').pop().toLowerCase();  //file extension from input file
      console.log("extension " + extension);
      if (extension === 'obj') {
        //console.log("extension === obj");
        //console.log("reader.result " + reader.result);
        $("#mtl_input_div").show();
        objData = {
          obj: reader.result,
          position: position,
          rotation: rotation,
          link: link
        };
        objFile = file;
        //handle the actual upload after mtl decision
      }

    }

  }
  if (file) {
    reader.readAsDataURL(file);
  } else {
    console.log("Reader fail")
  }
}

function objUpload() {

  $("#mtl_input_div").hide();

  addModelToScene(objData.obj, objData.mtl, objData.position, objData.rotation, objData.link);

  var data = { obj: objData.obj, mtl: objData.mtl, position: objData.position, rotation: objData.rotation, link: objData.link};

  //adds model to scene for others in room NOW
  NAF.connection.broadcastDataGuaranteed('modelPlaced', JSON.stringify(data));

  //adds model to scene for others in room LATER
  awsGetSignedRequest(objFile, null, "obj");
  if (objData.mtl != null) awsGetSignedRequest(mtlFile, null, "mtl");
}

function awsGetSignedRequest(file, data, modelType){
  const xhr = new XMLHttpRequest();
  //TODO add random unique characters after file name to prevent overwriting
  var name = (file.name).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  console.log("name: " + name);
  if (modelType != null) {
    xhr.open('GET', `/sign-s3?file-name=${name}`); 
  }
  else {
    xhr.open('GET', `/sign-s3?file-name=${name}&file-type=${file.type}`); 
  }
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
        const response = JSON.parse(xhr.responseText);
        awsUploadFile(file, response.signedRequest, response.url, data, modelType);
      }
      else{
        alert('Could not upload file (could not get signed URL).');
      }
    }
  };
  xhr.send();
}

//TODO add a loading indicator to be displayed between selecting a file and the upload being completed

function awsUploadFile(file, signedRequest, url, data, modelType){
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', signedRequest);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
        if (modelType === "obj") {
          objData.obj = url;
          if (objData.mtl == null) {
            addModelToDatabase();
          }
        }
        else if (modelType === "mtl") {
          objData.mtl = url;
          addModelToDatabase();
        }
        else {
          data.src = url;
          addImageToDatabase(data);
        }
      }
      else{
        alert('Could not upload file.');
      }
    }
  };
  xhr.send(file);
}

function addImageToDatabase(data) {
  $.ajax({
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    url: location.protocol + '//' + location.host + location.pathname + '/imageUpload',
    success: function(data) {
      console.log('success');
    }
  });
}

function addModelToDatabase() {
  $.ajax({
    type: 'POST',
    data: JSON.stringify(objData),
    contentType: 'application/json',
    url: location.protocol + '//' + location.host + location.pathname + '/modelUpload',
    success: function(data) {
      console.log('success');
    }
  });
}
